/**
 * The word pool for Word Bounties — proper nouns from Jujutsu Kaisen and
 * Frieren: Beyond Journey's End, used here only as short guessable strings
 * (the way any trivia or word game references character/place names), not
 * reproducing any story text, dialogue, or artwork.
 *
 * Deliberately a flat list with no per-word difficulty rating — "difficult"
 * in the feature's own pitch just means "not from the regular game's every-
 * day categories," which this list already is by construction.
 */
export interface TAnimeWord {
  word: string;
  category: string;
}

export const ANIME_WORDS: TAnimeWord[] = [
  { word: "GOJO", category: "Anime" },
  { word: "SUKUNA", category: "Anime" },
  { word: "ITADORI", category: "Anime" },
  { word: "MEGUMI", category: "Anime" },
  { word: "NOBARA", category: "Anime" },
  { word: "NANAMI", category: "Anime" },
  { word: "TODO", category: "Anime" },
  { word: "MAKI", category: "Anime" },
  { word: "SHIBUYA", category: "Anime" },
  { word: "JUJUTSU", category: "Anime" },
  { word: "FRIEREN", category: "Anime" },
  { word: "HIMMEL", category: "Anime" },
  { word: "FERN", category: "Anime" },
  { word: "STARK", category: "Anime" },
  { word: "HEITER", category: "Anime" },
  { word: "EISEN", category: "Anime" },
  { word: "AURA", category: "Anime" },
  { word: "SERIE", category: "Anime" },
];

/** N random words, chosen without replacement — what a sender picks from
 * when starting a bounty. Small enough that duplicates across two calls
 * are expected and fine; this is flavour, not a fairness-critical draw. */
export function randomWordOptions(count: number): TAnimeWord[] {
  const shuffled = [...ANIME_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
