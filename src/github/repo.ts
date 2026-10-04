/** A GitHub repository, as named by an entry's `repo:` frontmatter. */
export type RepoRef = { owner: string; name: string };

const REPO_ROOT = /^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?$/;

/**
 * The repository a frontmatter `repo:` URL names, or `null` when it is not the
 * root of a github.com repository. Only the root is accepted: a `/tree/…` URL
 * would make every README link resolve against the wrong place.
 */
export function parseRepoUrl(url: string | null | undefined): RepoRef | null {
  if (!url) return null;
  const match = REPO_ROOT.exec(url.trim());
  return match ? { owner: match[1]!, name: match[2]! } : null;
}

export function repoWebUrl(repo: RepoRef): string {
  return `https://github.com/${repo.owner}/${repo.name}`;
}
