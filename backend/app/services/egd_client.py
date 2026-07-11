"""EGD GraphQL API client with caching."""
import httpx
import os
import time
from functools import lru_cache
from typing import Any

EGD_ENDPOINT = "https://europeangodatabase.eu/api/v2026.02/graphql"


class EGDAuthError(Exception):
    """Raised when EGD API authentication fails."""
    pass


class EGDAPIError(Exception):
    """Raised when EGD API returns an error."""
    pass


class EGDClient:
    def __init__(self):
        self._token = os.environ.get("EGD_API_TOKEN", "")
        self._headers = {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
        }
        self._cache: dict[str, tuple[float, Any]] = {}
        self._cache_ttl = 300  # 5 minutes

    async def _query(self, query: str, variables: dict | None = None) -> dict:
        """Execute a GraphQL query."""
        cache_key = f"{query}:{variables}"
        if cache_key in self._cache:
            ts, data = self._cache[cache_key]
            if time.time() - ts < self._cache_ttl:
                return data

        payload = {"query": query}
        if variables:
            payload["variables"] = variables

        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=False) as client:
                resp = await client.post(EGD_ENDPOINT, headers=self._headers, json=payload)
                
                # Check for authentication errors
                if resp.status_code in (401, 403):
                    raise EGDAuthError("EGD API authentication failed. Please check your API token in backend/.env")
                
                # Check for redirect (token expired/invalid)
                if resp.status_code in (301, 302, 307, 308):
                    location = resp.headers.get("location", "")
                    if "login" in location.lower():
                        raise EGDAuthError("EGD API token is expired or invalid. Please get a new token from europeangodatabase.eu")
                
                resp.raise_for_status()
                result = resp.json()

            if "errors" in result:
                error_msg = result["errors"][0].get("message", str(result["errors"]))
                raise EGDAPIError(f"EGD API error: {error_msg}")

            self._cache[cache_key] = (time.time(), result)
            return result
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (401, 403):
                raise EGDAuthError("EGD API authentication failed. Please check your API token in backend/.env")
            raise EGDAPIError(f"EGD API request failed: {e.response.status_code}")
        except httpx.RequestError as e:
            raise EGDAPIError(f"EGD API unavailable: {str(e)}")

    async def search_players(self, search: str, limit: int = 20) -> dict:
        """Search players by name (typo-tolerant)."""
        query = """
        query SearchPlayers($search: String!, $limit: Int!) {
          playersSearch(
            search: $search
            pagination: { page: 1, limit: $limit }
          ) {
            data {
              pin
              firstName
              lastName
              countryCode
              grade
              rating
              club
              totalTournaments
              lastAppearance
            }
            total
            currentPage
            hasMorePages
          }
        }
        """
        result = await self._query(query, {"search": search, "limit": limit})
        return result["data"]["playersSearch"]

    async def get_player_by_pin(self, pin: int) -> dict:
        """Get player details by PIN."""
        query = """
        query GetPlayer($pin: Int!) {
          player(pin: $pin) {
            pin
            firstName
            lastName
            countryCode
            club
            grade
            rating
            deltaRating
            proposedGrade
            totalTournaments
            lastAppearance
            egfPlacement
            placements {
              data {
                id
                tournamentCode
                placement
                gradeDeclared
                wonGames
                lostGames
                jigoGames
                precedentRating
                followingRating
                tournament {
                  code
                  description
                  date
                  city
                  nation
                }
              }
            }
          }
        }
        """
        result = await self._query(query, {"pin": pin})
        player = result["data"]["player"]
        
        # Try to fetch biography separately (some players have corrupted biography data)
        try:
            bio_query = """
            query GetPlayerBio($pin: Int!) {
              player(pin: $pin) {
                biography {
                  type
                  biography
                  photo
                }
              }
            }
            """
            bio_result = await self._query(bio_query, {"pin": pin})
            player["biography"] = bio_result["data"]["player"].get("biography")
        except (EGDAPIError, KeyError):
            # Biography fetch failed, set to None
            player["biography"] = None
        
        return player

    async def get_player_games(self, pin: int, page: int = 1, limit: int = 50) -> dict:
        """Get player's game history."""
        query = """
        query GetPlayerGames($pin: Int!, $page: Int!, $limit: Int!) {
          games(
            filter: { playerPin: $pin }
            order: { field: DATE, direction: DESC }
            pagination: { page: $page, limit: $limit }
          ) {
            data {
              id
              date
              round
              result
              handicap
              tournament {
                code
                description
                date
              }
              player1 { pin firstName lastName }
              player2 { pin firstName lastName }
            }
            total
            currentPage
            hasMorePages
          }
        }
        """
        result = await self._query(query, {"pin": pin, "page": page, "limit": limit})
        return result["data"]["games"]

    async def get_player_tournaments(self, pin: int) -> list[dict]:
        """Get player's tournament history from placements."""
        player = await self.get_player_by_pin(pin)
        placements = player.get("placements", {}).get("data", [])
        tournaments = []
        seen_codes = set()
        for p in placements:
            t = p.get("tournament", {})
            code = t.get("code", "")
            if code and code not in seen_codes:
                seen_codes.add(code)
                tournaments.append({
                    "code": code,
                    "description": t.get("description", ""),
                    "date": t.get("date", ""),
                    "city": t.get("city", ""),
                    "nation": t.get("nation", ""),
                    "placement": p.get("placement"),
                    "grade_declared": p.get("gradeDeclared", ""),
                    "won": p.get("wonGames", 0),
                    "lost": p.get("lostGames", 0),
                    "jigo": p.get("jigoGames", 0),
                    "rating_before": p.get("precedentRating"),
                    "rating_after": p.get("followingRating"),
                })
        return tournaments

    async def get_player_by_name_or_pin(self, search: str) -> dict | None:
        """Search by PIN if numeric, otherwise by name."""
        if search.isdigit():
            pin = int(search)
            try:
                return await self.get_player_by_pin(pin)
            except (ValueError, httpx.HTTPError):
                return None
        else:
            results = await self.search_players(search, limit=1)
            data = results.get("data", [])
            if data:
                return await self.get_player_by_pin(data[0]["pin"])
            return None


# Singleton
egd_client = EGDClient()
