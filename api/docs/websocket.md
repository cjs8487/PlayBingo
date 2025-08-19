# PlayBingo WebSocket Documentation

WebSockets are the primary communication method of choice for applications that
need to both send and receive data from the server in real time.

## Versioning
**While PlayBingo is still in beta, we make no guarantees about the portability
of the WebSocket protocol between versions. The protocol version will not be
incremented according to semantic versioning rules unless there is an extreme
case.**

**Current Protocol Version: v1**

Whenever a breaking change is introduced to the protocol, the version number
will be incremented. Non-breaking changes may result in a minor version update.
Patch versions are not used, nor are new features guaranteed to cause version
changes.

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

```json
{
  "players": [],
  "connectedPlayer": {
    "id": "abc",
    "nickname": "player",
    "color": "blue",
    "goalCount": 0,
    "spectator": false,
    "monitor": true
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
        "completedPlayers": ["player1", "player3"]
      }
    ]
  },
  "chatHistory": [],
  "nickname": "websocket player",
  "color": "blue",
  "roomData": {
    "name": "Websocket Documentation",
    "game": "PlayBingo",
    "slug": "ferocious-bingo-4821",
    "gameSlug": "bingo",
    "racetimeConnection": {
      "gameActive": false
    }
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

**Sample Message**
```json
{
  "action": "cellUpdate",
  "row": 2,
  "col": 3,
  "cell": {
    "goal": "Complete a line of goals",
    "description": "Complete a line of goals in any direction",
    "completedPlayers": ["green", "#ff0000"]
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
          "completedPlayers": ["player2"]
        },
        {
          "goal": "goal": {
            "id": "abc23",
            "goal": "Goal 2",
            "description": "Description of goal 2",
            "difficulty": 1,
            "categories": ["cat1",]
        },
          "completedPlayers": ["player1"]
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
    "gameSlug": "updated-game-slug"
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
  "players": [
    {
      "nickname": "player1",
      "color": "red",
      "goalCount": 5,
      "racetimeStatus": {
        "connected": true,
        "username": "racer1",
        "status": "in progress",
        "finishTime": "PT1H30M"
      }
    }
  ],
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
Changes the player's selected color. The color must be a valid CSS color or hex
code.

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

### New Card
Regenerates the room's bingo card. If parameters are not provided, the previous
values will be reused, except for the seed, which will be randomized if left
blank. This action is only available if the authorization token it is sent with
has the monitor permission.

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