# Test Coverage Analysis & Improvement Plan

> **Date:** July 2026  
> **Status:** Proposal  
> **Location:** tests

## Summary

Our existing test suite covers board generation, utility functions, and basic user registration, but large areas of the codebase remain completely untested — particularly API routes, database operations, Room logic (mark/unmark/join/leave/win conditions), authentication, WebSocket handling, and race integration.

This document outlines what's currently tested, what's missing, and a phased plan to add both unit tests and integration tests backed by a real PostgreSQL database.

---

## What's Currently Tested

| Test File | What It Tests |
|-----------|---------------|
| `createUser.test.ts` | Registration endpoint — auth token validation, user creation (mocked DB) |
| `GoalValidation.test.ts` | `validateGoalMeta()` — byte limits, prototype pollution, circular refs, depth bombs |
| `core/boardGenerator.test.ts` | Full board generation pipeline — filters, layouts (random/SRLv5/static), restrictions, determinism |
| `core/Cleanup.test.ts` | Room inactivity detection, `canClose()`, cleanup timer |
| `core/TeamPlayer.test.ts` | Team goal marking/unmarking with BigInt bitmasks, exploration cell reveals |
| `util/Array.test.ts` | Seeded `shuffle()` function |
| `util/WinDetection.test.ts` | `computeLineMasks()` and `hasLineCompletion()` for variable board sizes |

**What works well:** Board generation is thoroughly tested. Utility functions have solid coverage. The test setup provides a reusable auth mock pattern.

**What's weak:** All DB interactions are mocked — we have no confidence the actual queries work. Only 1 out of ~15 route files has any test coverage. Core Room logic (the largest file) is barely tested beyond cleanup.

---

## Gaps — Unit Tests Needed

### Priority 1: Core Game Logic

**`core/Room.ts`** (~1200 lines, barely tested)

| Method | What to Test |
|--------|-------------|
| `handleMark` / `handleUnmark` | Cell state changes, broadcast to all players, permission enforcement |
| `handleJoin` / `handleSocketClose` | Player tracking, team assignment, reconnection |
| `handleChat` | Message broadcasting, chat-disabled enforcement |
| `handleNewCard` | Board re-generation, state clearing |
| `checkWinConditions` | All three modes: LOCKOUT, LINES, BLACKOUT |
| `canAutoAuthenticate` | Staff/moderator detection |

**`auth/RoomAuth.ts`**

| Function | What to Test |
|----------|-------------|
| `createRoomToken()` | Produces valid JWT, correct payload fields (roomSlug, playerId, permissions) |
| `verifyRoomToken()` | Rejects invalid/expired/wrong-room tokens; accepts valid |
| `invalidateToken()` | Token rejected after invalidation |
| `hasPermission()` | Spectators can't mark/unmark, only monitors can newCard, etc. |

### Priority 2: Authentication & Users

**`lib/Auth.ts`**
- `validatePassword()` — correct password → true, wrong → false
- `validateUsernamePasswordCombo()` — same, by username
- `hashPassword()` determinism

**`util/Session.ts`**
- `removeSessionsForUser()` — finds and removes all sessions for a user

### Priority 3: API Routes (only Registration has a test)

| Route File | Endpoints to Test |
|-----------|-------------------|
| `auth/Auth.ts` | Login, logout, session validation |
| `games/Games.ts` | CRUD games |
| `games/Variants.ts` | CRUD variants |
| `goals/Goals.ts` | CRUD goals |
| `goals/GoalCategories.ts` | Category management |
| `goals/Upload.ts` | Bulk goal upload/import |
| `rooms/Rooms.ts` | Room creation, listing |
| `rooms/actions/Actions.ts` | Room action dispatching |
| `users/Users.ts` | User profile retrieval/update |
| `oauth/OAuth.ts` | OAuth flow |
| middleware.ts | `requiresApiToken` — valid/invalid/missing token |

### Priority 4: Supporting Modules

| Module | What to Test |
|--------|-------------|
| `core/RoomServer.ts` | WebSocket token verification, 60s auth timeout, message routing, ping/keepalive |
| `core/integration/races/LocalTimer.ts` | Timer start/stop/reset |
| `core/integration/races/RacetimeHandler.ts` | Racetime.gg WebSocket integration (mock external WS) |
| `communication/outgoing/Email.ts` | Template rendering, transport mocking |
| `media/MediaServer.ts` | Avatar upload validation, file type/size checks |

---

## Integration Tests — New Test Suite

### Why?

All existing tests mock the database. This means:
- **Zero confidence** that Prisma queries actually work against PostgreSQL
- Schema migrations could break queries without any test catching it
- Complex queries with joins, filters, and relations are completely untested

### Architecture

```
┌─────────────────────────────────────────────┐
│  jest.integration.config.ts                 │
│  (separate config, *.integration.test.ts)   │
├─────────────────────────────────────────────┤
│  Global Setup                               │
│  - Create test database (bingogg_test)      │
│  - Run prisma migrate deploy                │
│  - Optionally seed reference data           │
├─────────────────────────────────────────────┤
│  Test Execution                             │
│  - Real Prisma client → real PostgreSQL     │
│  - cleanDatabase() between test files       │
├─────────────────────────────────────────────┤
│  Global Teardown                            │
│  - Drop test database                       │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  Docker Compose (already exists)            │
│  PostgreSQL 14 on port 5432                 │
└─────────────────────────────────────────────┘
```

### Phase 1: Test Infrastructure

1. **Create `jest.integration.config.ts`** — separate Jest config targeting `**/*.integration.test.ts` with longer timeouts (30s)
2. **Create `src/tests/integration/setup.ts`** — global setup that creates `bingogg_test` database, runs `prisma migrate deploy`, exports `cleanDatabase()` helper
3. **Create `src/tests/integration/teardown.ts`** — drops the test database
4. **Add npm script:**
   ```json
   "test:integration": "DATABASE_URL=postgresql://postgres:password@localhost:5432/bingogg_test jest --config jest.integration.config.ts --forceExit --runInBand"
   ```

### Phase 2: Database Layer Tests

| Test File | Functions to Cover |
|-----------|-------------------|
| `database/Users.integration.test.ts` | `registerUser`, `userByEmail`, `userByUsername`, `emailUsed`, `usernameUsed`, `getUser` |
| `database/Rooms.integration.test.ts` | `createRoom`, `addJoinAction`, `addMarkAction`, `setRoomBoard`, `getFullRoomList` |
| `database/games/Games.integration.test.ts` | Full CRUD for games |
| `database/games/Goals.integration.test.ts` | CRUD goals, category/tag associations, filtering |
| `database/auth/ApiTokens.integration.test.ts` | Token creation, `validateToken`, revocation |

### Phase 3: Route Integration Tests (HTTP + Real DB)

Use `supertest` with the real Express app + real database:

| Test File | Flow to Test |
|-----------|-------------|
| `routes/registration.integration.test.ts` | Full registration → verify user in DB |
| `routes/auth.integration.test.ts` | Register → login → session cookie → authenticated request → logout |
| `routes/games.integration.test.ts` | Create game → list → get → update → delete |
| `routes/goals.integration.test.ts` | Create goal → assign categories/tags → filter → delete |
| `routes/rooms.integration.test.ts` | Create room → list → verify DB entry |

### Phase 4: WebSocket Integration Tests (can defer)

- Use the `ws` library as a test client
- Full lifecycle: connect → authenticate → join room → mark cell → verify state → detect win → disconnect

### Cleanup Strategy

Truncate all tables between test files:

```typescript
export async function cleanDatabase() {
  const tablenames = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;
  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
    }
  }
}
```

---

## Suggested First Contributions

| Task | Difficulty | Impact |
|------|-----------|--------|
| Unit tests for `auth/RoomAuth.ts` | Easy | High — critical auth path |
| Unit tests for `hasPermission()` | Easy | High — security-relevant |
| Integration test infrastructure (Phase 1) | Medium | High — unblocks all integration work |
| Unit tests for `Room.checkWinConditions` | Medium | High — core game logic |
| Database integration tests for Users | Easy | Medium — template for other DB tests |
| Route tests for middleware.ts | Easy | Medium — auth boundary |
| Unit tests for `core/Room.handleMark` | Hard | High — complex state management |

---

## CI Integration

```yaml
- name: Start test database
  run: docker compose up -d

- name: Wait for PostgreSQL
  run: until pg_isready -h localhost -p 5432; do sleep 1; done

- name: Run unit tests
  run: npm test

- name: Run integration tests
  run: npm run test:integration
  env:
    DATABASE_URL: postgresql://postgres:password@localhost:5432/bingogg_test

- name: Stop test database
  run: docker compose down
```

---

## Coverage Targets

| Module | Current (est.) | Target |
|--------|----------------|--------|
| `core/` | ~30% | >70% |
| `database/` | 0% | >80% |
| `routes/` | ~5% | >60% |
| `auth/` | 0% | >90% |
| `util/` | ~60% | >90% |
| `lib/` | 0% | >80% |

---

## Open Questions

1. **Test DB seeding** — Should integration tests use `prisma db seed` for baseline reference data, or create all needed data in each test?
2. **CI environment** — Does CI already have Docker available, or do we need a service container?
3. **WebSocket tests** — Should we defer Phase 4 until Phases 1-3 are solid?