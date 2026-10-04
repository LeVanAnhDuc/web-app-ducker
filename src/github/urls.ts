import type { RepoRef } from "./repo";

/** Where a README lives, which is what its relative URLs are relative to. */
export type ReadmeLocation = { repo: RepoRef; branch: string; path: string };

/** A scheme (`https:`, `mailto:`), a protocol-relative URL or an in-page anchor. */
const NOT_RELATIVE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

/**
 * Turns a URL written inside a README into one that works on this site.
 *
 * A README on GitHub resolves `docs/a.png` against its own directory on its own
 * branch. Rendered here, the same string would resolve against a Ducker page and
 * 404. Links go to the blob view, so a reader lands on GitHub's rendering; images
 * go to raw.githubusercontent.com, because a blob URL serves HTML, not the image.
 */
export function absolutizeUrl(url: string, kind: "link" | "image", at: ReadmeLocation): string {
  if (url === "" || NOT_RELATIVE.test(url)) return url;

  const dir = at.path.includes("/") ? at.path.slice(0, at.path.lastIndexOf("/") + 1) : "";
  // A throwaway origin gives us the URL spec's own `./`, `../` and `/` resolution,
  // including clamping `../` at the root, instead of re-implementing it.
  const resolved = new URL(url, `https://readme.invalid/${dir}`);
  const repoPath = resolved.pathname.replace(/^\//, "");
  const { owner, name } = at.repo;
  const base =
    kind === "image"
      ? `https://raw.githubusercontent.com/${owner}/${name}/${at.branch}/`
      : `https://github.com/${owner}/${name}/blob/${at.branch}/`;
  return `${base}${repoPath}${resolved.search}${resolved.hash}`;
}
