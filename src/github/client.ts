/**
 * The one place this site talks to the GitHub REST API (ADR-0023).
 *
 * Nothing here throws. A build that cannot reach GitHub still has to produce
 * every page — GitHub being down degrades one tab, it does not fail a deploy.
 */
const GITHUB_API = "https://api.github.com";

/** How long a fetched README or release list is reused — the same hour as the routes' ISR. */
export const REVALIDATE_SECONDS = 3600;

export type Fetched<T> = { status: "ok"; data: T } | { status: "empty" } | { status: "unavailable" };

export type JsonResult = { ok: true; body: unknown } | { ok: false; status: number | "network" | "parse" };

export async function githubJson(path: string): Promise<JsonResult> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  // Optional: anonymous calls get 60 an hour, which one build (~38 calls) fits
  // under — barely. With a token it is 5,000.
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${GITHUB_API}${path}`, {
      headers,
      // Also caches in `next dev`, where every request re-renders the page and
      // would otherwise spend the anonymous hourly budget in a few clicks.
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch {
    return { ok: false, status: "network" };
  }
  if (!response.ok) return { ok: false, status: response.status };
  try {
    return { ok: true, body: await response.json() };
  } catch {
    return { ok: false, status: "parse" };
  }
}

/** One line per failure, naming the repository — a swallowed error would read as "no README". */
export function warnUnavailable(
  what: string,
  repo: { owner: string; name: string },
  status: number | string,
): void {
  console.warn(`[github] ${what} unavailable for ${repo.owner}/${repo.name}: ${status}`);
}
