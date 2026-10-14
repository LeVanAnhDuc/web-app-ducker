/**
 * Client-side fuzzy matching for the search box. It runs over the preloaded index,
 * so typing never hits the network.
 */

import { slugify } from "@/lib/slug";
import type { SearchDoc } from "@/lib/search-index";

/**
 * Normalises both the query and the content to the same diacritic-free ASCII form.
 *
 * Reusing `slugify` is deliberate: diacritic-insensitive search is a real need —
 * Vietnamese users typing fast almost always drop the marks ("tap luyen") — and if
 * the two sides stripped them with different mechanisms they would drift sooner or
 * later. The result looks like `tap-luyen`; the hyphen doubles as the word boundary.
 */
const normalize = (input: string): string => slugify(input);

/** Default number of results — enough for a suggestion list without clogging the UI. */
const DEFAULT_LIMIT = 20;

/** Score per kind of match; the title weighs more than the body. */
const SCORE = {
  titleExact: 100,
  titlePrefix: 60,
  titlePhrase: 40,
  titleToken: 12,
  textPhrase: 20,
  textToken: 4,
} as const;

function scoreDoc(doc: SearchDoc, phrase: string, tokens: string[]): number {
  const title = normalize(doc.title);
  const text = normalize(doc.text);
  const haystack = `${title}-${text}`;

  // Every word of the query must appear somewhere, otherwise the results get
  // diluted: typing two words and matching only one is a wrong suggestion.
  if (!tokens.every((token) => haystack.includes(token))) return 0;

  let score = 0;
  if (title === phrase) score += SCORE.titleExact;
  else if (title.startsWith(phrase)) score += SCORE.titlePrefix;
  else if (title.includes(phrase)) score += SCORE.titlePhrase;

  if (text.includes(phrase)) score += SCORE.textPhrase;

  for (const token of tokens) {
    if (title.includes(token)) score += SCORE.titleToken;
    if (text.includes(token)) score += SCORE.textToken;
  }

  return score;
}

/**
 * Returns the matching entries, sorted by descending score. An empty query returns
 * an empty array, not the whole index: a search box that dumps every page before
 * anything is typed is unreadable, and it hides the "no results yet" state.
 */
export function fuzzyMatch(
  query: string,
  docs: SearchDoc[],
  limit: number = DEFAULT_LIMIT,
): SearchDoc[] {
  const phrase = normalize(query);
  if (!phrase) return [];

  const tokens = phrase.split("-").filter(Boolean);
  if (tokens.length === 0) return [];

  return docs
    .map((doc, index) => ({ doc, index, score: scoreDoc(doc, phrase, tokens) }))
    .filter((hit) => hit.score > 0)
    // Equal scores keep index order so the results are stable.
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(0, limit))
    .map((hit) => hit.doc);
}
