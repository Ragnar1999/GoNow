# European Go Database (EGD) GraphQL API Reference

## Endpoint

```
POST https://europeangodatabase.eu/api/v2026.02/graphql
```

## Authentication

Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
Content-Type: application/json
```

Token details:
- Name: `dev`, Scope: `read`
- Created from the Developer tab in the EGD admin panel

---

## Queries

### `player(pin: Int!)` -> `Player`

Fetch a single player by their unique PIN.

```graphql
query {
  player(pin: 17401142) {
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
    biography { type biography photo }
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
  }
}
```

### `playersSearch(search, filter?, order?, pagination)` -> `PlayerPagination`

Typo-tolerant search for players by name.

**Parameters:**
- `search: String!` - search term (required)
- `filter: PlayerFilterInput` - optional filters
- `order: PlayerOrderInput` - optional sorting
- `pagination: PaginationInput!` - pagination (required)

```graphql
query {
  playersSearch(
    search: "Zhan Shi"
    pagination: { page: 1, limit: 10 }
  ) {
    data {
      pin firstName lastName countryCode grade rating club
      totalTournaments lastAppearance
    }
    total
    currentPage
    hasMorePages
  }
}
```

### `players(filter?, order?, pagination)` -> `PlayerPagination`

List players with filters and sorting.

```graphql
query {
  players(
    filter: { countryCode: "DE", ratingFrom: 2000, ratingTo: 3000 }
    order: { field: RATING, direction: DESC }
    pagination: { page: 1, limit: 20 }
  ) {
    data { pin firstName lastName rating grade }
    total
  }
}
```

### `tournaments(filter?, order?, pagination)` -> `TournamentPagination`

List tournaments with filters.

### `games(filter?, order?, pagination)` -> `GamePagination`

List games with filters.

---

## Types (from schema introspection)

### Player

| Field | Type | Description |
|-------|------|-------------|
| pin | Int! | Unique player identifier |
| agaId | Int! | AGA ID |
| firstName | String! | First name |
| lastName | String! | Last name |
| countryCode | String! | Country code (ISO) |
| club | String | Club affiliation |
| grade | String! | Current grade/rank (e.g., "5d", "11k") |
| rating | Int | Current GoR rating |
| deltaRating | Int | Rating change |
| proposedGrade | String! | Proposed next grade |
| totalTournaments | Int | Total tournaments played |
| lastAppearance | String | Date of last tournament |
| egfPlacement | Int | EGF ranking position |
| gamesAsPlayer1 | GameList | Games as white |
| gamesAsPlayer2 | GameList | Games as black |
| placements | PlacementList | Tournament placements |
| tournaments | TournamentList | Tournament history |
| biography | Biography | Player bio |

### Tournament

| Field | Type | Description |
|-------|------|-------------|
| code | String! | Tournament code (e.g., "T160829A") |
| description | String | Tournament name/description |
| date | String! | Tournament date |
| city | String! | City |
| nation | String! | Nation |
| tournamentClass | TournamentClassEnum! | Class |
| rounds | Int! | Number of rounds |
| totalPlayers | Int | Total players |
| status | TournamentStatusEnum! | Status |
| reliability | Int | Reliability score |
| categoriesDescription | String | Categories |
| games | GameList | Games in tournament |
| placements | PlacementList | Placements |
| players | PlayerList | Players |

### Placement

| Field | Type | Description |
|-------|------|-------------|
| id | Int! | Placement ID |
| pinPlayer | Int! | Player PIN |
| tournamentCode | String! | Tournament code |
| firstName | String | First name |
| lastName | String | Last name |
| countryCode | String! | Country |
| club | String! | Club |
| placement | Int! | Final placement |
| gradeDeclared | String! | Grade at time of tournament |
| wonGames | Int! | Games won |
| lostGames | Int! | Games lost |
| jigoGames | Int! | Draws |
| precedentRating | Float | Rating before tournament |
| followingRating | Float | Rating after tournament |
| player | Player | Player object |
| tournament | Tournament | Tournament object |

### Game

| Field | Type | Description |
|-------|------|-------------|
| id | Int! | Game ID |
| tournamentCode | String! | Tournament code |
| date | String | Game date |
| round | Int! | Round number |
| pinPlayer1 | Int! | Player 1 PIN |
| color1 | GameColorEnum | Player 1 color |
| pinPlayer2 | Int! | Player 2 PIN |
| color2 | GameColorEnum | Player 2 color |
| handicap | Int! | Handicap |
| result | String! | Result |
| sgfCode | String | SGF game record |
| tournament | Tournament | Tournament object |
| player1 | Player | Player 1 object |
| player2 | Player | Player 2 object |

### Biography

| Field | Type | Description |
|-------|------|-------------|
| type | String! | Biography type |
| biography | String | Biography text |
| photo | String | Photo URL |

### PlayerFilterInput

| Field | Type |
|-------|------|
| pin | Int |
| countryCode | String |
| grade | String |
| club | String |
| lastName | String |
| firstName | String |
| ratingFrom | Int |
| ratingTo | Int |

### PlayerOrderInput

| Field | Type |
|-------|------|
| field | PlayerOrderFieldEnum |
| direction | OrderDirectionEnum |

### PlayerOrderFieldEnum

`PIN`, `LAST_NAME`, `FIRST_NAME`, `COUNTRY_CODE`, `RATING`, `TOTAL_TOURNAMENTS`

### OrderDirectionEnum

`ASC`, `DESC`

### PaginationInput

| Field | Type |
|-------|------|
| page | Int |
| limit | Int |

### Pagination Response

| Field | Type |
|-------|------|
| data | [Type!]! |
| total | Int! |
| from | Int |
| to | Int |
| perPage | Int! |
| currentPage | Int! |
| lastPage | Int! |
| hasMorePages | Boolean! |
