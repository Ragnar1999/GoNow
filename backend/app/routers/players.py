"""Player-related API routes."""
from fastapi import APIRouter, HTTPException, Query
from app.services.egd_client import egd_client, EGDAuthError, EGDAPIError

router = APIRouter(prefix="/api", tags=["players"])


@router.get("/search")
async def search_players(q: str = Query(..., min_length=1)):
    """Search players by name or PIN."""
    try:
        # If numeric, try direct PIN lookup first
        if q.isdigit():
            try:
                player = await egd_client.get_player_by_pin(int(q))
                if player:
                    return {
                        "data": [{
                            "pin": player["pin"],
                            "firstName": player["firstName"],
                            "lastName": player["lastName"],
                            "countryCode": player["countryCode"],
                            "grade": player["grade"],
                            "rating": player["rating"],
                            "club": player.get("club"),
                            "totalTournaments": player.get("totalTournaments"),
                            "lastAppearance": player.get("lastAppearance"),
                        }],
                        "total": 1,
                        "currentPage": 1,
                        "hasMorePages": False,
                    }
            except EGDAuthError:
                raise HTTPException(status_code=401, detail="EGD API authentication failed. Please check your API token.")
            except EGDAPIError as e:
                raise HTTPException(status_code=502, detail=str(e))
            except Exception:
                pass

        # Fall back to name search
        result = await egd_client.search_players(q)
        return result
    except EGDAuthError:
        raise HTTPException(status_code=401, detail="EGD API authentication failed. Please check your API token in backend/.env")
    except EGDAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/player/{pin}")
async def get_player(pin: int):
    """Get player details with rating history."""
    try:
        player = await egd_client.get_player_by_pin(pin)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")

        # Extract rating evolution for chart
        placements = player.get("placements", {}).get("data", [])
        rating_history = []
        for p in placements:
            t = p.get("tournament", {})
            rating_history.append({
                "date": t.get("date", ""),
                "tournament": t.get("description", ""),
                "city": t.get("city", ""),
                "nation": t.get("nation", ""),
                "placement": p.get("placement"),
                "grade": p.get("gradeDeclared", ""),
                "rating_before": p.get("precedentRating"),
                "rating_after": p.get("followingRating"),
                "won": p.get("wonGames", 0),
                "lost": p.get("lostGames", 0),
                "jigo": p.get("jigoGames", 0),
            })

        # Sort by date
        rating_history.sort(key=lambda x: x["date"] or "")

        return {
            **player,
            "rating_history": rating_history,
        }
    except EGDAuthError:
        raise HTTPException(status_code=401, detail="EGD API authentication failed. Please check your API token in backend/.env")
    except EGDAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/player/{pin}/games")
async def get_player_games(
    pin: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    """Get player's game history."""
    try:
        result = await egd_client.get_player_games(pin, page, limit)
        return result
    except EGDAuthError:
        raise HTTPException(status_code=401, detail="EGD API authentication failed. Please check your API token.")
    except EGDAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/player/{pin}/tournaments")
async def get_player_tournaments(pin: int):
    """Get player's tournament history."""
    try:
        tournaments = await egd_client.get_player_tournaments(pin)
        # Sort by date
        tournaments.sort(key=lambda x: x.get("date", "") or "")
        return {"data": tournaments, "total": len(tournaments)}
    except EGDAuthError:
        raise HTTPException(status_code=401, detail="EGD API authentication failed. Please check your API token.")
    except EGDAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
