# Zeke Mobile Server

The backend for **Zeke Mobile**, the Godot game — kept in its own repo
(`zeke-mobile-server`, a sibling of the game's `zeke-mobile` repo) on purpose,
so the game and the server can be deployed, versioned, and (if it ever comes
to it) staffed independently. Two things live here that the game itself
shouldn't hold:

- **Accounts** — email/password and Google Sign-In, so a person is the same
  person across devices.
- **The Daily Challenge** — a universal "word of the day" and each player's
  streak. This has to live on a server almost by definition: everyone needs
  the *same* word, and a streak has to survive the app being reinstalled.

Node.js + Express + TypeScript, storing everything in one SQLite file via
Node's own built-in `node:sqlite` — no separate database server to install,
no native module to compile.

## Running it

Requires **Node.js 22.5 or newer** (this was built and tested against 24).

```bash
npm install
cp .env.example .env    # defaults work as-is; only Google needs real values
npm run dev
```

That starts it on `http://localhost:4000` with auto-reload on save. You'll see
one experimental-feature warning about SQLite on startup — expected, harmless,
see [Why `node:sqlite`](#why-nodesqlite) below.

For a longer-running deployment:

```bash
npm run build   # compiles src/ -> dist/
npm start       # runs the compiled output
```

Point the game at this server by setting `base_url` in the game repo's
`auth/api_config.cfg` — it defaults to `http://localhost:4000`, so if you're
running both on the same machine for testing, there's nothing to change.

## What's here

| Path                              | What it does                                    |
| ---------------------------------- | ------------------------------------------------ |
| `src/index.ts`                    | Starts the HTTP server                          |
| `src/app.ts`                      | Express app: middleware, routes, error handling |
| `src/config.ts`                   | Reads `.env`; safe zero-config defaults          |
| `src/db.ts`                       | Opens the SQLite file, creates tables if needed |
| `src/routes/auth.routes.ts`       | Signup, login, Google exchange, `/auth/me`      |
| `src/routes/daily.routes.ts`      | Today's word, streak status, recording a result |
| `src/services/users.service.ts`   | Password hashing, account lookups               |
| `src/services/token.service.ts`   | Signs/verifies session tokens (JWT)             |
| `src/services/google.service.ts`  | The actual Google OAuth token exchange          |
| `src/services/daily.service.ts`   | Word-of-the-day selection + streak math         |
| `src/data/dailyWords.ts`          | The word pool the daily challenge draws from    |

## API

Every response is JSON. Authenticated routes take `Authorization: Bearer <token>`,
the token you get back from signup/login/Google.

| Method | Path             | Auth? | Body                          | Returns                                              |
| ------ | ---------------- | :---: | ------------------------------ | ----------------------------------------------------- |
| POST   | `/auth/signup`   |   –   | `{name, email, password}`     | `{token, user}`                                       |
| POST   | `/auth/login`    |   –   | `{email, password}`           | `{token, user}`                                       |
| POST   | `/auth/google`   |   –   | `{code, codeVerifier, redirectUri}` | `{token, user}`                                 |
| GET    | `/auth/me`       |   ✓   | —                               | `{user}`                                              |
| GET    | `/daily/today`   |   ✓   | —                               | `{date, word, category}`                              |
| GET    | `/daily/status`  |   ✓   | —                               | `{date, playedToday, won, streak, longest}`           |
| POST   | `/daily/complete`|   ✓   | `{won, mistakes}`             | Same shape as `/daily/status`, after recording it      |

`user` is always `{id, name, email, provider}` — `provider` is `"local"` or
`"google"`, `password` and Google tokens never appear in a response.

### Design choices worth knowing about

- **`/auth/google` does the real OAuth exchange.** The game only ever gets an
  authorization `code` from Google (via the system browser) and a PKCE
  `codeVerifier` it generated itself; it hands both here, and this server —
  holding the real `GOOGLE_CLIENT_SECRET` — does the token exchange and the
  profile lookup. The secret never ships inside the game.
- **The daily word isn't secret.** `/daily/today` returns the actual word to
  anyone who asks, authenticated or not conceptually — it's gated behind auth
  here mainly so a request always carries a user id, not to hide the word.
  The rest of the game already trusts the client with its own word in plain
  text (see the main project's `scripts/game_state.gd`), so this matches that
  existing trust model rather than introducing a new one.
- **"One shot" is enforced here, not just in the game's UI.** `POST
  /daily/complete` is idempotent per user per day — calling it twice the same
  day returns the first result rather than overwriting it. A modified client
  can't replay the daily challenge by asking twice.
- **Streak math** (`src/services/daily.service.ts`): a win only extends the
  streak if the *previous* win was exactly yesterday; any gap restarts it at
  1. A loss zeroes the current streak but does **not** overwrite the last-win
  date, so a win the day after a loss still correctly starts a fresh streak
  rather than accidentally reviving the broken one.
- **Google account linking.** If someone signs up locally with
  `jo@example.com` and later taps "Continue with Google" using that same
  address, they land back on the *same* account rather than a duplicate.

## Setting up Google Sign-In

The game's own `auth/README.md` walks through creating the Google Cloud OAuth
client (5 minutes, one-time). Once you have a **Client ID** and **Client
Secret**:

1. Put the Client ID in the *game's* `auth/google_oauth.cfg` (it's meant to be
   public — Google's own guidance treats client IDs that way).
2. Put **both** the Client ID and Client Secret in *this* repo's `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
   The secret stays here — it's what makes this pattern more secure than the
   game doing the token exchange itself.

Without these, the server still runs fine — `/auth/google` just returns a
clear "Google Sign-In isn't configured on this server yet" error instead of a
stack trace, and local email/password accounts and the Daily Challenge both
work regardless.

## Why `node:sqlite`

No native module to install (no build tools, no prebuilt-binary version
mismatches — a real risk with something like `better-sqlite3` on a very
current Node release), the whole "database" is one file you can open, back
up, or delete, and it's part of Node itself rather than a third-party
dependency. It's still labeled experimental upstream, which is the one thing
to watch — if that ever becomes a real problem, `src/db.ts` is the only file
that would need to change to move to Postgres or MySQL; every service talks
to `db.prepare(...)` through that one module, not to SQLite specifics
scattered around.

## Data

Everything lives in one file at `DATABASE_PATH` (default `./data/zeke.db`),
created automatically on first run. Three tables: `users`, `daily_completions`
(one row per person per day played), `streaks` (current/longest per person).
Delete the file to reset everything — it's gitignored, so this never touches
version control.
