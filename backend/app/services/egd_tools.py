"""EGD operations defined as OpenAI-compatible tool schemas for function calling."""
from app.services.egd_client import egd_client

# Tool definitions for OpenRouter/OpenAI function calling
EGD_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_player",
            "description": "Search for a Go player by name or PIN in the European Go Database. Returns a list of matching players with basic info.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Player name (partial match supported) or PIN number",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_player_details",
            "description": "Get detailed profile of a Go player by their PIN, including grade, rating, tournament history, and biography.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pin": {
                        "type": "integer",
                        "description": "The player's EGD PIN number",
                    }
                },
                "required": ["pin"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_player_rating_history",
            "description": "Get a player's rating evolution over time from tournament results.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pin": {
                        "type": "integer",
                        "description": "The player's EGD PIN number",
                    }
                },
                "required": ["pin"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_player_games",
            "description": "Get a player's recent game history with opponents, results, and tournament info.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pin": {
                        "type": "integer",
                        "description": "The player's EGD PIN number",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max number of games to return (default 20, max 200)",
                    },
                },
                "required": ["pin"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compare_players",
            "description": "Compare two Go players by their PINs. Returns side-by-side stats including rating, grade, tournaments, and head-to-head if available.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pin1": {
                        "type": "integer",
                        "description": "First player's EGD PIN number",
                    },
                    "pin2": {
                        "type": "integer",
                        "description": "Second player's EGD PIN number",
                    },
                },
                "required": ["pin1", "pin2"],
            },
        },
    },
]


async def execute_tool(name: str, arguments: dict) -> dict:
    """Execute a tool by name with given arguments. Returns the result as a dict."""
    try:
        if name == "search_player":
            result = await egd_client.search_players(arguments["query"], limit=10)
            return {"success": True, "data": result}

        elif name == "get_player_details":
            pin = arguments["pin"]
            player = await egd_client.get_player_by_pin(pin)
            if not player:
                return {"success": False, "error": f"Player with PIN {pin} not found"}
            # Extract rating history
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
                })
            rating_history.sort(key=lambda x: x["date"] or "")
            return {
                "success": True,
                "data": {
                    "pin": player["pin"],
                    "name": f"{player['firstName']} {player['lastName']}",
                    "country": player["countryCode"],
                    "club": player.get("club"),
                    "grade": player["grade"],
                    "rating": player["rating"],
                    "deltaRating": player.get("deltaRating"),
                    "proposedGrade": player.get("proposedGrade"),
                    "totalTournaments": player.get("totalTournaments"),
                    "egfPlacement": player.get("egfPlacement"),
                    "biography": player.get("biography"),
                    "rating_history": rating_history,
                },
            }

        elif name == "get_player_rating_history":
            pin = arguments["pin"]
            player = await egd_client.get_player_by_pin(pin)
            if not player:
                return {"success": False, "error": f"Player with PIN {pin} not found"}
            placements = player.get("placements", {}).get("data", [])
            history = []
            for p in placements:
                t = p.get("tournament", {})
                history.append({
                    "date": t.get("date", ""),
                    "tournament": t.get("description", ""),
                    "rating_before": p.get("precedentRating"),
                    "rating_after": p.get("followingRating"),
                    "grade": p.get("gradeDeclared", ""),
                    "placement": p.get("placement"),
                })
            history.sort(key=lambda x: x["date"] or "")
            return {"success": True, "data": history}

        elif name == "get_player_games":
            pin = arguments["pin"]
            limit = arguments.get("limit", 20)
            result = await egd_client.get_player_games(pin, limit=min(limit, 200))
            return {"success": True, "data": result}

        elif name == "compare_players":
            pin1, pin2 = arguments["pin1"], arguments["pin2"]
            p1 = await egd_client.get_player_by_pin(pin1)
            p2 = await egd_client.get_player_by_pin(pin2)
            if not p1:
                return {"success": False, "error": f"Player with PIN {pin1} not found"}
            if not p2:
                return {"success": False, "error": f"Player with PIN {pin2} not found"}
            return {
                "success": True,
                "data": {
                    "player1": {
                        "pin": p1["pin"],
                        "name": f"{p1['firstName']} {p1['lastName']}",
                        "country": p1["countryCode"],
                        "grade": p1["grade"],
                        "rating": p1["rating"],
                        "deltaRating": p1.get("deltaRating"),
                        "totalTournaments": p1.get("totalTournaments"),
                    },
                    "player2": {
                        "pin": p2["pin"],
                        "name": f"{p2['firstName']} {p2['lastName']}",
                        "country": p2["countryCode"],
                        "grade": p2["grade"],
                        "rating": p2["rating"],
                        "deltaRating": p2.get("deltaRating"),
                        "totalTournaments": p2.get("totalTournaments"),
                    },
                },
            }
        else:
            return {"success": False, "error": f"Unknown tool: {name}"}

    except Exception as e:
        return {"success": False, "error": str(e)}
