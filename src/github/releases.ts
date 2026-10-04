import { githubJson, warnUnavailable, type Fetched } from "./client";
import type { RepoRef } from "./repo";

export type Release = {
  tag: string;
  /** `null` when GitHub's name is empty or just repeats the tag. */
  name: string | null;
  /** ISO 8601, UTC (I11). */
  publishedAt: string;
  body: string;
  htmlUrl: string;
};

export function parseReleases(items: unknown[]): Release[] {
  const out: Release[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    if (r.draft === true) continue;
    if (typeof r.tag_name !== "string" || typeof r.html_url !== "string") continue;
    const publishedAt =
      typeof r.published_at === "string" ? r.published_at : typeof r.created_at === "string" ? r.created_at : null;
    if (publishedAt === null) continue;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    out.push({
      tag: r.tag_name,
      name: name !== "" && name !== r.tag_name ? name : null,
      publishedAt,
      body: typeof r.body === "string" ? r.body : "",
      htmlUrl: r.html_url,
    });
  }
  // ISO 8601 strings in the same zone sort correctly as plain strings.
  return out.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** The 100 most recent releases; the largest repository today has 24. */
export async function getReleases(repo: RepoRef): Promise<Fetched<Release[]>> {
  const result = await githubJson(`/repos/${repo.owner}/${repo.name}/releases?per_page=100`);
  if (!result.ok) {
    warnUnavailable("releases", repo, result.status);
    return { status: "unavailable" };
  }
  if (!Array.isArray(result.body)) {
    warnUnavailable("releases", repo, "malformed body");
    return { status: "unavailable" };
  }
  const releases = parseReleases(result.body);
  return releases.length === 0 ? { status: "empty" } : { status: "ok", data: releases };
}
