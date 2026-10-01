/**
 * Word of the Day — the v2 game's clue-driven take on the daily word.
 *
 * Some calendar days carry an "on this day in history" word with three
 * hand-written clues, lifted verbatim from the Zeke Mobile v2 design
 * (Zeke Mobile v2.dc.html's WOTD table). Every other day falls back to the
 * regular daily pool (daily-words.ts) with clues generated from the word
 * itself, so there is always a word and always three clues.
 *
 * Either way the word is fixed per UTC date, which keeps `/daily/complete`'s
 * one-shot rule and streaks meaningful: everyone who plays on the same day
 * gets the same word.
 */
import { wordForDay } from "./daily-words";

export interface WordOfTheDay {
  date: string;
  word: string;
  category: string;
  /** Card heading, e.g. "SEPT 29 · 1988" — the year only on history days. */
  label: string;
  /** Exactly three, easiest last. The game reveals one more per two misses. */
  clues: [string, string, string];
}

interface HistoryEntry {
  word: string;
  year: number;
  clues: [string, string, string];
}

/** Keyed by "M-D" (no zero padding), matching the design's table. */
const ON_THIS_DAY: Record<string, HistoryEntry> = {
  "9-23": { word: "NEPTUNE", year: 1846, clues: [
    "On this day in 1846, astronomers in Berlin spotted a new planet that math had predicted.",
    "It's the eighth and farthest planet from the Sun.",
    "Named after the Roman god of the sea."] },
  "9-26": { word: "DEBATE", year: 1960, clues: [
    "On this day in 1960, Kennedy and Nixon faced off in the first televised event of its kind.",
    "Two sides argue their points in front of an audience.",
    "Six letters. Starts with D."] },
  "9-27": { word: "RAILWAY", year: 1825, clues: [
    "On this day in 1825, the Stockton and Darlington line opened in England.",
    "It was the first public line to use steam locomotives.",
    "Trains run on it."] },
  "9-28": { word: "PENICILLIN", year: 1928, clues: [
    "On this day in 1928, Alexander Fleming noticed mould killing bacteria in a petri dish in London.",
    "It became the world's first widely used antibiotic.",
    "Starts with P. Ten letters, and three of them are I."] },
  "9-29": { word: "DISCOVERY", year: 1988, clues: [
    "On this day in 1988, NASA flew astronauts again for the first time since the Challenger disaster.",
    "It's the name of the Space Shuttle orbiter that made that flight.",
    "The word also means finding something new."] },
  "9-30": { word: "FLUTE", year: 1791, clues: [
    "On this day in 1791, Mozart's final opera premiered in Vienna.",
    "The opera is named after a magic musical instrument.",
    "It's a woodwind you play by blowing across a hole."] },
  "10-1": { word: "AUTOMOBILE", year: 1908, clues: [
    "On this day in 1908, Ford introduced the Model T.",
    "It made this machine affordable for ordinary families.",
    "Another word for car."] },
  "10-2": { word: "PEANUTS", year: 1950, clues: [
    "On this day in 1950, Charles Schulz's comic strip first ran in newspapers.",
    "It starred Charlie Brown and Snoopy.",
    "Also a salty snack that grows underground."] },
  "10-3": { word: "GERMANY", year: 1990, clues: [
    "On this day in 1990, East and West became one country again.",
    "Its capital is Berlin.",
    "Seven letters. Starts with G."] },
  "10-4": { word: "SPUTNIK", year: 1957, clues: [
    "On this day in 1957, the Soviet Union launched the first artificial satellite.",
    "It kicked off the Space Race.",
    "Its name means 'companion' in Russian."] },
  "10-5": { word: "BEATLES", year: 1962, clues: [
    "On this day in 1962, a Liverpool band released its first single, 'Love Me Do'.",
    "John, Paul, George and Ringo.",
    "Sounds like a bug, spelled like a beat."] },
  "10-6": { word: "JAZZ", year: 1927, clues: [
    "On this day in 1927, 'The Jazz Singer' premiered as the first feature film with synced talking.",
    "The film is named after a style of music.",
    "Four letters, two of them are Z."] },
  "10-8": { word: "CHICAGO", year: 1871, clues: [
    "On this day in 1871, the Great Fire began in this American city.",
    "It's known as the Windy City.",
    "It sits on the shore of Lake Michigan."] },
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUNE", "JULY", "AUG", "SEPT", "OCT", "NOV", "DEC"];

/** Clues for a pool word with no history attached — vague, then less so. */
function generatedClues(word: string, category: string): [string, string, string] {
  return [
    `Zeke filed this one under ${category}.`,
    `It has ${word.length} letters.`,
    `It starts with ${word[0]} and ends with ${word[word.length - 1]}.`,
  ];
}

export function wordOfTheDay(dateKey: string): WordOfTheDay {
  const [, m, d] = dateKey.split("-").map(Number);
  const heading = `${MONTHS[m - 1]} ${d}`;

  const history = ON_THIS_DAY[`${m}-${d}`];
  if (history) {
    return {
      date: dateKey,
      word: history.word,
      category: "On This Day",
      label: `${heading} · ${history.year}`,
      clues: history.clues,
    };
  }

  const { word, category } = wordForDay(dateKey);
  return { date: dateKey, word, category, label: heading, clues: generatedClues(word, category) };
}
