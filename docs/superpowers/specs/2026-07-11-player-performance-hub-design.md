# Player Performance Hub Design

## Goal

Give an individual Go player an immediate, trustworthy view of their progress, recent results, and latest tournament context using the existing European Go Database (EGD) integration.

## Scope

Add a dedicated **My Performance** view for any player profile. It complements the existing profile, which remains the detailed source of record.

The view answers three questions:

1. How is my rating progressing?
2. How have my latest games gone?
3. What did my latest tournament mean for that progress?

## User Experience

The new page is available at `/player/:pin/performance` from actions on the existing player profile and favourite-player cards.

The content order is:

1. **Performance header:** player name, grade, current GoR rating, and current rating delta.
2. **Recent form:** outcome sequence for the latest 20 games, wins, losses, jigo, win rate, and the current win or loss streak.
3. **Rating progress:** existing rating-history chart, with peak and net-change summary.
4. **Latest tournament:** name, date, placement, W/L/J record, and rating change based on the most recent placement with a date.
5. **Competitive matchup insight:** record against opponents within plus or minus 100 GoR of the player's current rating, when opponent ratings are supplied by EGD.

The page must clearly distinguish unavailable data from neutral or zero values. It must not invent an insight from incomplete results.

## Backend

Add `GET /api/player/{pin}/performance`.

It composes existing `EGDClient` operations into a typed response rather than requiring the frontend to parse EGD result formats. The endpoint returns a profile and rating history when those are available, then augments them with game-derived insights.

The response includes:

- Player summary and rating history.
- Recent games, limited to 20.
- `recent_form`: wins, losses, jigo, excluded games, total decided games, win rate, outcome sequence, and streak.
- `latest_tournament`: the latest dated placement, or `null`.
- `rating_band_matchup`: wins, losses, jigo, and number of eligible games, or an unavailable state when opponent ratings cannot be determined.

Outcome parsing uses the player's recorded colour and the EGD `result` value. Jigo is a separate outcome. Any unknown or ambiguous value is counted as excluded and never classified as a win or loss.

The EGD client cache remains the mechanism for avoiding duplicate upstream calls. If game analysis fails while profile data succeeds, the API returns the profile fields alongside an explicit unavailable analysis state. Authentication errors and complete upstream failures preserve the existing HTTP error behaviour.

## Frontend

Add:

- `PerformancePage`, fetched through React Query with a typed `getPlayerPerformance` client function.
- Reusable cards for recent form, rating progress, latest tournament, and matchup insight.
- A Performance action from profile and favourite-player entry points.

Loading uses page-level skeleton/loader treatment consistent with the current profile page. Partial analysis uses inline, non-blocking unavailable messaging. Sparse accounts still show the facts available; no trend claim is displayed with fewer than five parsed games.

## Edge Cases

- Jigo is included in the record but does not extend a win or loss streak.
- Unknown result formats are excluded and disclosed.
- A player without games receives a friendly empty recent-form state.
- A player without placements receives no latest-tournament card.
- Opponents without ratings are excluded from the plus-or-minus-100-GoR matchup calculation.
- Missing dates do not determine recency.

## Testing

- Backend unit tests cover colour-aware outcome parsing, jigo, unknown outcomes, streak calculation, win-rate calculation, and rating-band filtering.
- Route tests cover successful responses, no-games/sparse-data responses, partial game-analysis failure, EGD authentication failure, and upstream API failure.
- Frontend tests cover loading, populated, empty, and partial-analysis states.

## Out of Scope

- User accounts, persistent player ownership, notifications, or training recommendations.
- Predictions about future rating or results.
- Changes to the EGD source data or its caching policy beyond reuse of the current cache.
