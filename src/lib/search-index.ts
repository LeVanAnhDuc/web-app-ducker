/**
 * Builds the search index from content. Pure — no filesystem, no network — so the
 * route handler feeds it whatever the content layer read, and tests need no files.
 */

/** One index entry: enough to render a result without asking the server again. */
export type SearchDoc = {
  href: string;
  title: string;
  kind: "app" | "game" | "doc";
  text: string;
};

/** One block of an entry's content. `body` is raw markdown. */
type SectionInput = { title: string; body: string };

export type SearchIndexInput = {
  apps: { slug: string; name: string; sections: SectionInput[] }[];
  games: { slug: string; name: string; sections: SectionInput[] }[];
  docs: { slug: string; title: string; sections: SectionInput[] }[];
  locale: string;
};

/**
 * Strips markdown syntax, keeping only the words a reader sees.
 *
 * Code blocks are dropped whole, not just unfenced: shell commands (`pnpm install`,
 * `docker compose up`) repeat across dozens of pages, so keeping them would make any
 * technical query match nearly the whole index.
 */
export function stripMarkdown(md: string): string {
  return (
    md
      // Fenced code (``` or ~~~) — contents and all.
      .replace(/^[ \t]*(```|~~~)[\s\S]*?^[ \t]*\1[ \t]*$/gm, " ")
      // A fence left unclosed at the end of the string.
      .replace(/^[ \t]*(```|~~~)[\s\S]*$/m, " ")
      // Images: dropped; the alt text usually repeats the caption around it.
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      // Links: keep the text, drop the URL.
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Reference links `[text][label]` and the label definitions at the end.
      .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, " ")
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
      // Raw HTML tags, autolinks `<https://...>` included.
      .replace(/<[^>\n]*>/g, " ")
      // Inline code: keep the text inside (usually a field or variable name).
      .replace(/`+([^`]*)`+/g, "$1")
      // Heading, blockquote and list markers.
      .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, "")
      .replace(/^[ \t]{0,3}>[ \t]?/gm, "")
      .replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/gm, "")
      // Horizontal rules.
      .replace(/^[ \t]*(?:[-*_][ \t]*){3,}$/gm, " ")
      // The GFM table delimiter row, then the pipes.
      .replace(/^[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(?:\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*$/gm, " ")
      .replace(/\|/g, " ")
      // Emphasis markers. `_` goes only at a word's edge, so a `snake_case`
      // field name does not collapse into one meaningless token.
      .replace(/\*\*|~~|\*/g, "")
      .replace(/(^|\s)_+|_+(?=\s|$)/g, "$1")
      // Collapse all whitespace: the result is a single line.
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Flattens every block's title and body into one string to match against. */
function flattenSections(sections: SectionInput[]): string {
  return sections
    .flatMap((s) => [s.title, stripMarkdown(s.body)])
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Builds the index for one locale. `title` is always the display name (Ducker ID),
 * never the slug — the slug only ever plays a secondary role in the interface.
 */
export function buildSearchIndex(input: SearchIndexInput): SearchDoc[] {
  const { locale } = input;

  const apps: SearchDoc[] = input.apps.map((app) => ({
    href: `/${locale}/apps/${app.slug}`,
    title: app.name,
    kind: "app",
    text: flattenSections(app.sections),
  }));

  const games: SearchDoc[] = input.games.map((game) => ({
    href: `/${locale}/games/${game.slug}`,
    title: game.name,
    kind: "game",
    text: flattenSections(game.sections),
  }));

  const docs: SearchDoc[] = input.docs.map((doc) => ({
    href: `/${locale}/docs/${doc.slug}`,
    title: doc.title,
    kind: "doc",
    text: flattenSections(doc.sections),
  }));

  return [...apps, ...games, ...docs];
}
