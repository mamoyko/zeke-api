/**
 * The daily word pool, in Zeke's own voice — same categories as the regular
 * game (see the Godot project's scripts/game_state.gd CATEGORIES). One word
 * of the day is picked deterministically from this list (see
 * daily.service.ts), so every player gets the same word on the same UTC date
 * with no database seeding step required.
 *
 * Add to this list any time; it only ever grows, so past dates never change.
 */
export interface DailyWord {
  word: string;
  category: string;
}

export const DAILY_WORDS: DailyWord[] = [
  { word: "ZOMBIE", category: "Spooky" },
  { word: "GRAVEYARD", category: "Spooky" },
  { word: "MIDNIGHT", category: "Spooky" },
  { word: "SKELETON", category: "Spooky" },
  { word: "COFFIN", category: "Spooky" },
  { word: "SHOVEL", category: "Spooky" },
  { word: "MUMMY", category: "Spooky" },
  { word: "HAUNTED", category: "Spooky" },
  { word: "WAFFLE", category: "Food" },
  { word: "PICKLE", category: "Food" },
  { word: "NOODLE", category: "Food" },
  { word: "COOKIE", category: "Food" },
  { word: "BRAINS", category: "Food" },
  { word: "PANCAKE", category: "Food" },
  { word: "HOODIE", category: "Everyday" },
  { word: "PUZZLE", category: "Everyday" },
  { word: "GARDEN", category: "Everyday" },
  { word: "PILLOW", category: "Everyday" },
  { word: "UMBRELLA", category: "Everyday" },
  { word: "BACKPACK", category: "Everyday" },
  { word: "POTATO", category: "Zeke Lore" },
  { word: "MONDAYS", category: "Zeke Lore" },
  { word: "SNEAKERS", category: "Zeke Lore" },
  { word: "NAPTIME", category: "Zeke Lore" },
];

/** UTC calendar day, e.g. "2026-09-14" — the unit a "day" means everywhere here. */
export function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function daysSinceEpoch(dateKey: string): number {
  return Math.floor(Date.parse(`${dateKey}T00:00:00Z`) / 86_400_000);
}

/** The same word for every player, for a given UTC day. */
export function wordForDay(dateKey: string): DailyWord {
  const index = ((daysSinceEpoch(dateKey) % DAILY_WORDS.length) + DAILY_WORDS.length)
    % DAILY_WORDS.length;
  return DAILY_WORDS[index];
}
