// src/github/index.ts
//
// The only door to the GitHub API (ADR-0023), as `src/content/` is the only door
// to `content/`. `boundary.test.ts` keeps it that way.
export { REVALIDATE_SECONDS, type Fetched } from "./client";
export { getReadme, parseReadme, type Readme } from "./readme";
export { getReleases, parseReleases, type Release } from "./releases";
export { parseRepoUrl, repoWebUrl, type RepoRef } from "./repo";
export { absolutizeUrl, type ReadmeLocation } from "./urls";
