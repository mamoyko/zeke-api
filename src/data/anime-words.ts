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
  { word: "GETO", category: "Anime" },
  { word: "TOJI", category: "Anime" },
  { word: "MAHITO", category: "Anime" },
  { word: "JOGO", category: "Anime" },
  { word: "CHOSO", category: "Anime" },
  { word: "YUTA", category: "Anime" },
  { word: "INUMAKI", category: "Anime" },
  { word: "PANDA", category: "Anime" },
  { word: "UTAHIME", category: "Anime" },
  { word: "KENJAKU", category: "Anime" },
  { word: "TENGEN", category: "Anime" },
  { word: "YUJI", category: "Anime" },
  { word: "SATORU", category: "Anime" },
  { word: "SUGURU", category: "Anime" },
  { word: "KUGISAKI", category: "Anime" },
  { word: "FUSHIGURO", category: "Anime" },
  { word: "RYOMEN", category: "Anime" },
  { word: "MAHORAGA", category: "Anime" },
  { word: "HIGURUMA", category: "Anime" },
  { word: "HAKARI", category: "Anime" },
  { word: "KASHIMO", category: "Anime" },
  { word: "RIKA", category: "Anime" },
  { word: "MIWA", category: "Anime" },
  { word: "URAUME", category: "Anime" },
  { word: "MECHAMARU", category: "Anime" },
  { word: "HANAMI", category: "Anime" },
  { word: "DAGON", category: "Anime" },
  { word: "FLAMME", category: "Anime" },
  { word: "QUAL", category: "Anime" },
  { word: "LUGNER", category: "Anime" },
  { word: "LINIE", category: "Anime" },
  { word: "DRAHT", category: "Anime" },
  { word: "KANTE", category: "Anime" },
  { word: "LAND", category: "Anime" },
  { word: "UBEL", category: "Anime" },
  { word: "WIRBEL", category: "Anime" },
  { word: "SENSE", category: "Anime" },
  { word: "METHODE", category: "Anime" },
  { word: "SEIN", category: "Anime" },
  { word: "DENKEN", category: "Anime" },
  { word: "RICHTER", category: "Anime" },
  { word: "LAUFEN", category: "Anime" },
  { word: "KANNE", category: "Anime" },
  { word: "LAWINE", category: "Anime" },
  { word: "SOLITAR", category: "Anime" },
  { word: "MACHT", category: "Anime" },
  { word: "GLUCK", category: "Anime" },
  { word: "ORDEN", category: "Anime" },
  { word: "SPIEGEL", category: "Anime" },
  { word: "VOLL", category: "Anime" },
  { word: "GRAU", category: "Anime" },
  { word: "PLUS", category: "Anime" },
  { word: "MINUS", category: "Anime" },
  { word: "KRAFT", category: "Anime" },
  { word: "LILLE", category: "Anime" },
  { word: "SHOKO", category: "Anime" },
  { word: "IEIRI", category: "Anime" },
  { word: "DOMAIN", category: "Anime" },
  { word: "CURSED", category: "Anime" },
  { word: "SHIKIGAMI", category: "Anime" },
  { word: "SIMPLEDOMAIN", category: "Anime" },
  { word: "BLACKFLASH", category: "Anime" },
  { word: "REVERSE", category: "Anime" },
  { word: "HEIAN", category: "Anime" },
  { word: "SENDAGI", category: "Anime" },
  { word: "KYOTO", category: "Anime" },
  { word: "TOKYO", category: "Anime" },
  { word: "SHINJUKU", category: "Anime" },
  { word: "ROPPONGI", category: "Anime" },
];

/** N random words, chosen without replacement — what a sender picks from
 * when starting a bounty. Small enough that duplicates across two calls
 * are expected and fine; this is flavour, not a fairness-critical draw. */
export function randomWordOptions(count: number): TAnimeWord[] {
  const shuffled = [...ANIME_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
