import { githubJson, warnUnavailable, type Fetched } from "./client";
import type { RepoRef } from "./repo";

export type Readme = { markdown: string; branch: string; path: string; htmlUrl: string };

/**
 * The README endpoint's JSON, reduced to what rendering needs.
 *
 * The branch comes from `html_url` (`…/blob/<branch>/<path>`) rather than from a
 * second call for the repository's default branch: one request per repository
 * keeps a build inside the anonymous rate limit. Cutting the known `/<path>`
 * off the end keeps branch names that contain a slash intact.
 */
export function parseReadme(body: unknown): Readme | null {
  if (typeof body !== "object" || body === null) return null;
  const { content, path, html_url: htmlUrl } = body as Record<string, unknown>;
  if (typeof content !== "string" || typeof path !== "string" || typeof htmlUrl !== "string") return null;

  const marker = "/blob/";
  const start = htmlUrl.indexOf(marker);
  const suffix = `/${path}`;
  if (start < 0 || !htmlUrl.endsWith(suffix)) return null;
  const branch = htmlUrl.slice(start + marker.length, htmlUrl.length - suffix.length);
  if (branch === "") return null;

  return { markdown: Buffer.from(content, "base64").toString("utf8"), branch, path, htmlUrl };
}

/** Never `empty`: a repository without a README answers 404, which is `unavailable`. */
export async function getReadme(repo: RepoRef): Promise<Fetched<Readme>> {
  const result = await githubJson(`/repos/${repo.owner}/${repo.name}/readme`);
  if (!result.ok) {
    warnUnavailable("README", repo, result.status);
    return { status: "unavailable" };
  }
  const readme = parseReadme(result.body);
  if (!readme) {
    warnUnavailable("README", repo, "malformed body");
    return { status: "unavailable" };
  }
  return { status: "ok", data: readme };
}
