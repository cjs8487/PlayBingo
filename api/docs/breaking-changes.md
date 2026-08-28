# Teams Refactor Breaking Changes

This release changes the room WebSocket protocol from player-owned state to
team-owned state. Third-party clients must update their room state models before
connecting to rooms running this API version.

## Player Lists

The `players` field on `connected`, `chat`, `cellUpdate`, `syncBoard`, and other
room messages is no longer an array of players. It is now an object with two
arrays:

```ts
{
    teams: Team[];
    spectators: Player[];
}
```

Players in `teams` are nested under their team. Spectators are listed only in
`spectators`. Each `Player` now has `teamId`, which is an empty string for a
spectator.

## Teams And Colors

`Team` is a new protocol type with `id`, `name`, `color`, `goalCount`, and
`players`. `Team.color` is the authoritative mark color.

`Player.color` has been removed from the API payload. Clients must read colors
from the containing team and must not render a color for spectators.

The existing `changeColor` action now changes the authenticated player's team
color. Spectators cannot use it.

## Board Cells

`completedPlayers` has been renamed to `completedTeams`. The array contains
team IDs rather than player IDs. Use each ID to resolve a team from
`players.teams`, then use that team's `color` when rendering a completed cell.

## Teams Setting

`RoomData` now includes required boolean `teamsEnabled`. It is included in the
initial room response and `updateRoomData` messages.

When `teamsEnabled` is `false`, the API still creates one internal team per
player to own marks, but messages display player names and joining another team
is forbidden. When it is `true`, messages display team names and players may
join existing teams.

Monitors can update the setting over WebSocket:

```json
{
    "action": "setTeamsEnabled",
    "payload": { "enabled": true },
    "authToken": "<room token>"
}
```

Clients should update local room state after the resulting `updateRoomData`
message.

## New Action

`joinTeam` is available when teams are enabled:

```json
{
    "action": "joinTeam",
    "payload": { "teamId": "<team id>" },
    "authToken": "<room token>"
}
```

Clients must handle `joinedTeam`, which returns the destination `Team`, and
`forbidden`, which is returned when teams are disabled or the token lacks the
necessary permission.