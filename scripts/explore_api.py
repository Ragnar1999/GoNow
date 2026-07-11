"""
EGD API Exploration Script
Tests authentication and searches for player "Zhan Shi"
"""
import httpx
import json
import os
from pathlib import Path

EGD_ENDPOINT = "https://europeangodatabase.eu/api/v2026.02/graphql"
EGD_TOKEN = os.environ.get("EGD_API_TOKEN", "19|MYnBjAPsK7jSQl0D6OHs8k7y5EpYacPs4zaTotZj8deb47c1")
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

HEADERS = {
    "Authorization": f"Bearer {EGD_TOKEN}",
    "Content-Type": "application/json",
}


def run_query(query: str, variables: dict | None = None) -> dict:
    """Execute a GraphQL query against the EGD API."""
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    resp = httpx.post(EGD_ENDPOINT, headers=HEADERS, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()


def save_json(data: dict, filename: str):
    """Save JSON data to output directory."""
    path = OUTPUT_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Saved to {path}")


def main():
    print("=" * 60)
    print("EGD API Exploration Script")
    print("=" * 60)

    # 1. Test auth with a simple query
    print("\n[1] Testing authentication...")
    q = """
    query {
      playersSearch(search: "test", pagination: { page: 1, limit: 1 }) {
        total
      }
    }
    """
    result = run_query(q)
    print(f"  Auth OK. Total players in DB: {result['data']['playersSearch']['total']}")

    # 2. Search for "Zhan Shi"
    print("\n[2] Searching for player 'Zhan Shi'...")
    q = """
    query SearchPlayer($search: String!) {
      playersSearch(
        search: $search
        pagination: { page: 1, limit: 10 }
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
    result = run_query(q, {"search": "Zhan Shi"})
    players = result["data"]["playersSearch"]["data"]
    print(f"  Found {len(players)} results:")
    for p in players:
        print(f"    - {p['firstName']} {p['lastName']} (PIN: {p['pin']}, "
              f"Grade: {p['grade']}, Rating: {p['rating']}, "
              f"Country: {p['countryCode']}, Club: {p['club']})")
    save_json(result, "zhan_shi_search.json")

    # 3. Get full player details with placements (correct field names)
    if players:
        pin = players[0]["pin"]
        print(f"\n[3] Fetching full details for PIN {pin}...")
        q = """
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
            gamesAsPlayer1 {
              data {
                id
                date
                round
                result
                handicap
                tournament { code description date }
                player2 { firstName lastName pin }
              }
            }
            gamesAsPlayer2 {
              data {
                id
                date
                round
                result
                handicap
                tournament { code description date }
                player1 { firstName lastName pin }
              }
            }
          }
        }
        """
        result = run_query(q, {"pin": pin})
        if "errors" in result:
            print(f"  ERRORS: {result['errors']}")
            return
        player = result["data"]["player"]
        print(f"  Full name: {player['firstName']} {player['lastName']}")
        print(f"  Grade: {player['grade']}, Rating: {player['rating']}")
        print(f"  Club: {player['club']}")
        print(f"  Total tournaments: {player['totalTournaments']}")
        print(f"  Last appearance: {player['lastAppearance']}")
        if player.get("placements", {}).get("data"):
            placements = player["placements"]["data"]
            print(f"  Placements ({len(placements)}):")
            for pl in placements[:5]:
                t = pl.get("tournament", {})
                print(f"    - {t.get('description', '?')} ({t.get('date', '?')}) "
                      f"#{pl.get('placement', '?')} | "
                      f"Grade: {pl.get('gradeDeclared', '?')} | "
                      f"Rating: {pl.get('precedentRating', '?')} -> {pl.get('followingRating', '?')} | "
                      f"W/L/J: {pl.get('wonGames', 0)}/{pl.get('lostGames', 0)}/{pl.get('jigoGames', 0)}")
        if player.get("gamesAsPlayer1", {}).get("data"):
            print(f"  Games as white: {len(player['gamesAsPlayer1']['data'])}")
        if player.get("gamesAsPlayer2", {}).get("data"):
            print(f"  Games as black: {len(player['gamesAsPlayer2']['data'])}")
        save_json(result, f"player_{pin}_full.json")

    # 4. Search by PIN
    if players:
        pin = players[0]["pin"]
        print(f"\n[4] Searching by PIN {pin}...")
        q = """
        query SearchByPin($pin: Int) {
          players(
            filter: { pin: $pin }
            pagination: { page: 1, limit: 1 }
          ) {
            data {
              pin
              firstName
              lastName
              grade
              rating
            }
          }
        }
        """
        result = run_query(q, {"pin": pin})
        p = result["data"]["players"]["data"][0]
        print(f"  PIN search result: {p['firstName']} {p['lastName']} "
              f"(Grade: {p['grade']}, Rating: {p['rating']})")
        save_json(result, f"player_{pin}_by_pin.json")

    print("\n" + "=" * 60)
    print("Exploration complete!")
    print(f"Output files saved to: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
