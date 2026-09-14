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
  return (await readGroup("apps", locale, root)).map(toCard);
}

export async function listGames(locale: string, root?: string): Promise<AppCard[]> {
  return (await readGroup("games", locale, root)).map(toCard);
}

export type AppSearchEntry = { slug: string; name: string; body: string };

/**
 * Every app's slug, name and body for one locale, in a single `readGroup` pass.
 *
 * Exists for the search index (I-3): building it by calling `getApp` once per app
 * from `listApps` re-reads the whole `apps` directory on every call (`readOne` is
 * `readGroup` plus a `find`), which is one directory scan and read per app on top
 * of the scan `listApps` itself already did. This reuses that single scan instead.
 */
export async function listAppsWithBody(locale: string, root?: string): Promise<AppSearchEntry[]> {
  return (await readGroup("apps", locale, root)).map((e) => ({
    slug: e.data.slug!,
    name: e.data.name,
    body: e.body,
  }));
}

export async function getApp(slug: string, locale: string, root?: string): Promise<AppDetail | null> {
  // Apps only — games have no detail page in this design; `/games` links outward.
  const entry = await readOne("apps", slug, locale, root);
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
