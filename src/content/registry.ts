import { readGroup, readOne, type ReadEntry } from "./read";
import type { Integration } from "./frontmatter";

export type { Integration } from "./frontmatter";

export type AppCard = {
  slug: string;
  name: string;
  tagline: string | null;
  integration: Integration;
  techStack: string[];
  repoUrl: string | null;
  isRepoPrivate: boolean;
  /** True when this entry is drawn as a branch under the identity provider. */
  parent: string | null;
};

export type AppDetail = AppCard & {
  body: string;
  features: { title: string; description: string | null; icon: string | null }[];
  locale: string;
  isFallback: boolean;
};

function toCard(e: ReadEntry): AppCard {
  return {
    slug: e.data.slug!,
    name: e.data.name,
    tagline: e.data.tagline ?? null,
    integration: e.data.status,
    techStack: e.data.techStack,
    repoUrl: e.data.repo ?? null,
    isRepoPrivate: e.data.repoPrivate,
    parent: e.data.parent ?? null,
  };
}

export async function listApps(locale: string, root?: string): Promise<AppCard[]> {
  return listEntries("apps", locale, root);
}

export async function listGames(locale: string, root?: string): Promise<AppCard[]> {
  return listEntries("games", locale, root);
}

export type EntrySearchEntry = { slug: string; name: string; body: string };

/**
 * Every entry's slug, name and body in one group for one locale, in a single
 * `readGroup` pass.
 *
 * Exists for the search index (I-3): building it by calling `getEntry` once per
 * entry re-reads the whole directory on every call (`readOne` is `readGroup` plus
 * a `find`), which is one directory scan and read per entry. This is one scan.
 */
export async function listEntriesWithBody(
  group: EntryGroup,
  locale: string,
  root?: string,
): Promise<EntrySearchEntry[]> {
  return (await readGroup(group, locale, root)).map((e) => ({
    slug: e.data.slug!,
    name: e.data.name,
    body: e.body,
  }));
}

/** The two groups that have detail pages; docs have their own reader. */
export type EntryGroup = "apps" | "games";

export async function listEntries(group: EntryGroup, locale: string, root?: string): Promise<AppCard[]> {
  return (await readGroup(group, locale, root)).map(toCard);
}

export async function getEntry(
  group: EntryGroup,
  slug: string,
  locale: string,
  root?: string,
): Promise<AppDetail | null> {
  const entry = await readOne(group, slug, locale, root);
  if (!entry) return null;
  return {
    ...toCard(entry),
    body: entry.body,
    features: entry.data.features.map((f) => ({
      title: f.title,
      description: f.description ?? null,
      icon: f.icon ?? null,
    })),
    locale: entry.locale,
    isFallback: entry.isFallback,
  };
}

export async function getApp(slug: string, locale: string, root?: string): Promise<AppDetail | null> {
  return getEntry("apps", slug, locale, root);
}
