"""
Explore a specific player's grade/rating evolution over time.
Usage: python explore_player.py [player_name_or_pin]
Default: "Zhan Shi"
"""
import httpx
import json
import sys
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
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    resp = httpx.post(EGD_ENDPOINT, headers=HEADERS, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()


def find_player(search_term: str) -> dict | None:
    """Find a player by name or PIN."""
    if search_term.isdigit():
        q = """
        query($pin: Int) {
          players(filter: { pin: $pin }, pagination: { page: 1, limit: 1 }) {
            data { pin firstName lastName grade rating countryCode club }
          }
        }
        """
        result = run_query(q, {"pin": int(search_term)})
        data = result["data"]["players"]["data"]
        return data[0] if data else None
    else:
        q = """
        query($search: String!) {
          playersSearch(search: $search, pagination: { page: 1, limit: 5 }) {
            data { pin firstName lastName grade rating countryCode club }
          }
        }
        """
        result = run_query(q, {"search": search_term})
        data = result["data"]["playersSearch"]["data"]
        return data[0] if data else None


def get_rating_history(pin: int) -> list[dict]:
    """Extract rating/grade evolution from tournament placements."""
    q = """
    query($pin: Int!) {
      player(pin: $pin) {
        pin
        firstName
        lastName
        currentGrade: grade
        currentRating: rating
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
    result = run_query(q, {"pin": pin})
    if "errors" in result:
        print(f"  Query errors: {result['errors']}")
        return []
    player = result["data"]["player"]

    history = []
    if player.get("placements", {}).get("data"):
        for p in player["placements"]["data"]:
            t = p.get("tournament", {})
            history.append({
                "tournament_code": t.get("code", ""),
                "tournament_desc": t.get("description", "Unknown"),
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

    # Save full response
    path = OUTPUT_DIR / f"player_{pin}_history.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    return history


def main():
    search_term = sys.argv[1] if len(sys.argv) > 1 else "Zhan Shi"
    print(f"Exploring player: {search_term}")
    print("=" * 60)

    # Find player
    player = find_player(search_term)
    if not player:
        print(f"Player '{search_term}' not found.")
        return

    print(f"\nPlayer: {player['firstName']} {player['lastName']}")
    print(f"PIN: {player['pin']}")
    print(f"Grade: {player['grade']}, Rating: {player['rating']}")
    print(f"Country: {player['countryCode']}, Club: {player.get('club', 'N/A')}")

    # Get rating history
    print(f"\nRating Evolution:")
    print("-" * 80)
    history = get_rating_history(player["pin"])
    for i, h in enumerate(history):
        rating_change = ""
        if h["rating_before"] is not None and h["rating_after"] is not None:
            delta = h["rating_after"] - h["rating_before"]
            rating_change = f"{h['rating_before']:.0f} -> {h['rating_after']:.0f} ({delta:+.0f})"
        print(f"  {i+1:3d}. {h['date']} | {h['tournament_desc'][:30]:30s} | "
              f"#{h['placement']:>3} | Grade: {h['grade_declared']:4s} | "
              f"Rating: {rating_change:25s} | "
              f"W/L/J: {h['won']}/{h['lost']}/{h['jigo']}")

    # Summary stats
    if history:
        ratings = [h["rating_after"] for h in history if h["rating_after"] is not None]
        if ratings:
            print(f"\nRating Summary:")
            print(f"  First recorded: {ratings[0]:.0f}")
            print(f"  Current:        {ratings[-1]:.0f}")
            print(f"  Peak:           {max(ratings):.0f}")
            print(f"  Total change:   {ratings[-1] - ratings[0]:+.0f}")

    print(f"\nTotal tournaments: {len(history)}")
    print(f"Data saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
