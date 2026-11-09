# PlayBingo WebSocket Documentation

WebSockets are the primary communication method of choice for applications that
need to both send and receive data from the server in real time.

## Versioning
**While PlayBingo is still in beta, we make no guarantees about the portability
of the WebSocket protocol between versions. The protocol version will not be
incremented according to semantic versioning rules unless there is an extreme
case.**

**Current Protocol Version: v2**

Whenever a breaking change is introduced to the protocol, the version number
will be incremented. Non-breaking changes may result in a minor version update.
Patch versions are not used, nor are new features guaranteed to cause version
changes.

### Changes in v2
Protocol v2 moves room state from players to teams. Clients written for v1 must
be updated before connecting to rooms running v2:

- The `players` field is no longer an array. It is now an object with `teams`
  and `spectators` arrays. See [Server Messages](#server-messages).
- `Player.color` has been removed. Colors belong to teams. See [Teams](#teams).
- `completedPlayers` on board cells has been renamed to `completedTeams` and
  contains team IDs instead of player IDs.
- Room data now includes the required `teamsEnabled` flag.
- `changeColor` now changes the color of the player's team.
- The `joinTeam` and `setTeamsEnabled` actions and the `joinedTeam`,
  `updatedTeam`, and `forbidden` server messages have been added.

## Connecting to a PlayBingo WebSocket
Establishing a WebSocket connection with the server is a multi-step process:

1. **Obtain connection credentials** for the room, typically using the room
   password. You will also need a nickname to identify the connection. Nicknames
   do not need to be unique and have no character restrictions.
2. **Send a POST request** to `/api/rooms/{slug}/authorize` with the password in
   the request body, where `{slug}` is the unique room identifier.
3. **Create the WebSocket connection** by connecting to `/socket/{slug}`.
4. **Send a `join` message** with your authorization token and nickname.

Authorization tokens remain valid as long as the room is active and the token is
not revoked. Tokens are not tied to individual connections, however they do
uniquely identify the user within the room. As of the release of PlayBingo beta
12, it is generally safe to use the same authorization token across multiple
websocket connections, though it is still not recommended.

Connections identified as inactive may be closed by the server. Spectator
connections are particularly susceptible to this if left open for extended
periods. If a connection is closed, you must repeat the authorization process.
As of beta 12, repeating the authentication process will not result in the
creation of new player unless the room is unable to reconcile the authorization
request with an existing player in the room.

### Automatic Authentication
Under special circumstances, services can bypass the normal authentication flow
through a process known as automatic authentication. Automatic authentication is
triggered automatically by making a request to GET request to
`/api/rooms/{slug}`. If automatic authentication is allowed, an authorization
token will be provided in the body of the response. Automatic authentication is
available only when a valid login session present, which is only available to
registered applications with a valid API key. The automatic authentication
framework will be expanded in the future as the service continues to grow.

### Post-Connection
Once the `join` message is sent, you should receive a `connected` message from
the server, indicating a successful join and providing the current room state.

## Server Messages
Server messages notify clients about changes in the room state or instruct
clients to perform actions. In Protocol v1, server messages are broadcast to all
open connections, except for `connected` messages, which are sent only to the
newly connected client.

All server messages follow this base format:

```json
{
  "action": "actionType"
}
```

Some information is sent across multiple server message types, and the presence
of the field does not indicate that any special event or change has occurred.
The `players` field contains up to date information about all players connected
to the room and the `connectedPlayer` field contains up to date information on
the player this message was sent to.

`players` is an object with two arrays. `teams` contains every team in the room,
with each team's players nested under it. `spectators` contains every player
that is not on a team. A player only ever appears in one of the two lists.

```json
{
  "players": {
    "teams": [
      {
        "id": "team1",
        "name": "Team Blue",
        "color": "blue",
        "goalCount": 3,
        "players": [
          {
            "id": "abc",
            "nickname": "player",
            "teamId": "team1",
            "monitor": true,
            "showInRoom": true,
            "raceStatus": { "connected": false }
          }
        ]
      }
    ],
    "spectators": [
      {
        "id": "def",
        "nickname": "spectator",
        "teamId": "",
        "monitor": false,
        "showInRoom": true,
        "raceStatus": { "connected": false }
      }
    ]
  },
  "connectedPlayer": {
    "id": "abc",
    "nickname": "player",
    "teamId": "team1",
    "monitor": true,
    "showInRoom": true,
    "raceStatus": { "connected": false }
  }
}
```

### Connected
Sent after a successful `join` action. This message contains identity
information and the current room state.

**Sample Message:**
```json
{
  "action": "connected",
  "board": {
    "board": [
      {
        "goal": {
            "id": "abc23",
            "goal": "Complete a goal",
            "description": "Complete any goal by any means necessary",
            "difficulty": 1,
            "categories": ["cat1", "cat2"]
        },
        "completedTeams": ["team1", "team3"]
      }
    ]
  },
  "chatHistory": [],
  "nickname": "websocket player",
  "roomData": {
    "name": "Websocket Documentation",
    "game": "PlayBingo",
    "slug": "ferocious-bingo-4821",
    "gameSlug": "bingo",
    "teamsEnabled": false,
    "racetimeConnection": {
      "gameActive": false
    }
  },
  "players": {
    "teams": [],
    "spectators": []
  }
}
```

### Chat
Indicates that a chat message was added to the room. Messages can be user-sent
or system-generated.

**Sample Message**
```json
{
  "action": "chat",
  "message": [
    {
      "contents": "Hello everyone!",
      "color": "blue"
    }
  ]
}
```

### Cell Update
Sent when the data for a specific cell changes (e.g., marked or unmarked). The
message includes the updated cell data.

`completedTeams` contains the IDs of the teams that have marked the cell.

**Sample Message**
```json
{
  "action": "cellUpdate",
  "row": 2,
  "col": 3,
  "cell": {
    "goal": "Complete a line of goals",
    "description": "Complete a line of goals in any direction",
    "completedTeams": ["team1", "team2"]
  }
}
```

### Sync Board
Sent when the entire board, or a large portion of it, is updated. The message
contains the new board state.

**Sample Message**
```json
{
  "action": "syncBoard",
  "board": {
    "board": [
      [
        {
          "goal": {
            "id": "abc23",
            "goal": "Goal 1",
            "description": "Description of goal 1",
            "difficulty": 1,
            "categories": ["cat2"]
        },
          "completedTeams": ["team2"]
        },
        {
          "goal": {
            "id": "abc23",
            "goal": "Goal 2",
            "description": "Description of goal 2",
            "difficulty": 1,
            "categories": ["cat1",]
        },
          "completedTeams": ["team1"]
        }
      ]
    ]
  }
}
```

### Unauthorized
Indicates that an action could not be performed due to invalid or expired
authorization.

**Sample Message**
```json
{
  "action": "unauthorized"
}
```

### Disconnected
Sent when a connection is closed by the server, typically in response to a
`leave` action or timeout.

**Sample Message**

```json
{
  "action": "disconnected"
}
```

### Update Room Data
Notifies clients of updates to core room information.

**Sample Message**
```json
{
  "action": "updateRoomData",
  "roomData": {
    "name": "Updated Room Name",
    "game": "Updated Game",
    "slug": "updated-room-slug",
    "gameSlug": "updated-game-slug",
    "teamsEnabled": true
  }
}
```

### Sync Race Data
Indicates updates related to racetime.gg integration, such as a change in
connection status or chat messages.

**Sample Message**
```json
{
  "action": "syncRaceData",
  "players": {
    "teams": [
      {
        "id": "team1",
        "name": "Team Red",
        "color": "red",
        "goalCount": 5,
        "players": [
          {
            "id": "abc",
            "nickname": "player1",
            "teamId": "team1",
            "monitor": false,
            "showInRoom": true,
            "raceStatus": {
              "connected": true,
              "username": "racer1",
              "finishTime": "PT1H30M"
            }
          }
        ]
      }
    ],
    "spectators": []
  },
  "racetimeConnection": {
    "gameActive": true,
    "url": "https://racetime.gg/room",
    "websocketConnected": true,
    "status": "active",
    "startDelay": "PT5M",
    "started": "2023-01-01T00:00:00Z",
    "ended": "2023-01-01T01:30:00Z"
  }
}
```

### Joined Team
Sent to clients after a successful `joinTeam` action. The message contains the team the player joined.

**Sample Message**
```json
{
  "action": "joinedTeam",
  "team": {
    "id": "team1",
    "name": "Team Blue",
    "color": "blue",
    "goalCount": 3,
    "players": [
      {
        "id": "abc",
        "nickname": "player",
        "teamId": "team1",
        "monitor": false,
        "showInRoom": true,
        "raceStatus": { "connected": false }
      }
    ]
  }
}
```

### Updated Team
Sent to clients after successful `joinTeam` action when a team got renamed instead of a new player joining. The message contains the updated team.

**Sample Message**
```json
{
  "action": "updatedTeam",
  "team": {
    "id": "team1",
    "name": "New Team Name",
    "color": "blue",
    "goalCount": 3,
    "players": [
      {
        "id": "abc",
        "nickname": "player",
        "teamId": "team1",
        "monitor": false,
        "showInRoom": true,
        "raceStatus": { "connected": false }
      }
    ]
  }
}
```

### Forbidden
Indicates that the authorization token is valid, but the action is not allowed.

**Sample Message**
```json
{
  "action": "forbidden"
}
```

## Room Actions
Room actions are sent by clients to change the state of the room. The absence of
a corresponding server message typically indicates that the action failed.

Room actions follow the same base format as server messages:

```json
{
  "action": "actionType"
}
```

If additional inputs are required, they are provided in the `payload` field.

Actions marked with `monitor` next to their name require the monitor
permission. If the authorization token the action is sent with does not have
this permission, the server responds with `forbidden`.

### Join
Activates the WebSocket connection to the room. The server uses the provided
nickname to identify the connection.

**Sample Message:**

```json
{
  "action": "join",
  "payload": {
    "nickname": "websocket player"
  },
  "authToken": "your-auth-token"
}
```

### Leave
Terminates the WebSocket connection. The client will no longer receive messages,
but any inflight messages may still be delivered.

**Sample Message:**

```json
{
  "action": "leave",
  "authToken": "your-auth-token"
}
```

### Chat
Sends a chat message to the room. All messages sent this way will appear as if
they are from the associated player.

**Sample Message:**

```json
{
  "action": "chat",
  "payload": {
    "message": "Hello, room!"
  },
  "authToken": "your-auth-token"
}
```

### Mark
Marks the specified cell for the player. If the cell is already marked, the
action does nothing.

**Sample Message:**

```json
{
  "action": "mark",
  "payload": {
    "row": 2,
    "col": 3
  },
  "authToken": "your-auth-token"
}
```

### Unmark
Unmarks the specified cell for the player. If the cell is not marked, the action
does nothing.

**Sample Message:**

```json
{
  "action": "unmark",
  "payload": {
    "row": 2,
    "col": 3
  },
  "authToken": "your-auth-token"
}
```

### Change Color
Changes the color of the authenticated player's team. Spectators cannot use this action.

**Sample Message:**

```json
{
  "action": "changeColor",
  "payload": {
    "color": "#ff00ff"
  },
  "authToken": "your-auth-token"
}
```

### New Card `monitor`
Regenerates the room's bingo card. If parameters are not provided, the previous
values will be reused, except for the seed, which will be randomized if left
blank.

**Sample Message:**

```json
{
  "action": "newCard",
  "payload": {
    "seed": 12345,
    "generationMode": "random"
  },
  "authToken": "your-auth-token"
}
```

### Join Team
Moves the authenticated player onto a new or existing team, or renames the
player's current team. This action is only available when `teamsEnabled` is
`true`. Otherwise the server responds with `forbidden`.

The payload accepts the following fields:

- `teamId` (required): The ID of the team to join. Set it to `null` to create a
  new team and move the player onto it.
- `teamName` (optional): A name to give the team. When `teamId` is the player's
  current team, the team is renamed and the player stays on it.

The server responds with `joinedTeam` when the player moved to another team or
created a new one, and with `updatedTeam` when the player renamed their current
team. If `teamId` does not match a team in the room, the server responds with
`unauthorized`. Other clients see the change through the chat message the server
sends and the updated `players` field.

**Sample Message (join an existing team):**

```json
{
  "action": "joinTeam",
  "payload": {
    "teamId": "team1"
  },
  "authToken": "your-auth-token"
}
```

**Sample Message (create a new team):**

```json
{
  "action": "joinTeam",
  "payload": {
    "teamId": null,
    "teamName": "My New Team"
  },
  "authToken": "your-auth-token"
}
```

**Sample Message (rename the current team):**

```json
{
  "action": "joinTeam",
  "payload": {
    "teamId": "team1",
    "teamName": "Renamed Team"
  },
  "authToken": "your-auth-token"
}
```

### Set Teams Enabled `monitor`
Enables or disables teams for the room.

**Sample Message:**

```json
{
  "action": "setTeamsEnabled",
  "payload": {
    "enabled": true
  },
  "authToken": "your-auth-token"
}
```
