import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./config";

/**
 * The whole "backend" for this app is one SQLite file, opened with Node's
 * own built-in driver — no native module to install, no separate database
 * server to run. `node:sqlite` is still marked experimental upstream (hence
 * the warning at startup); it has been solid for something this size, but if
 * that ever stops being true, swap this one file for a real Postgres/MySQL
 * client and nothing outside `db.ts` needs to change.
 */
mkdirSync(dirname(config.databasePath), { recursive: true });

export const db = new DatabaseSync(config.databasePath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    google_id     TEXT UNIQUE,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_completions (
    user_id  TEXT NOT NULL,
    date     TEXT NOT NULL,
    won      INTEGER NOT NULL,
    mistakes INTEGER NOT NULL,
    PRIMARY KEY (user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS streaks (
    user_id             TEXT PRIMARY KEY,
    current             INTEGER NOT NULL DEFAULT 0,
    longest             INTEGER NOT NULL DEFAULT 0,
    last_completed_date TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);
