# README and releases from GitHub, and a games section shaped like apps

> **Related:** FR-25 · FR-26 · FR-27 · ADR-0018 (amended) · ADR-0019 §4 · ADR-0022 ·
> ADR-0023 (to be written) · retires R5 of [`../file-backed-registry/`](../file-backed-registry/design.md)

## 1. What exists today

- `/[locale]/apps/<slug>` renders the hand-written body and `features` of
  `content/apps/<slug>.<locale>.mdx` inside `DocsShell` (sidebar · body · TOC).
- `/[locale]/apps` is a card grid, reachable by URL only: the "Applications" tab in
  `TopBar` opens the first app, through `firstLeafHref`.
- `/[locale]/games` is a card grid whose cards link straight to GitHub. There is no
  `/games/<slug>` (R5), and the "Games" nav row is a leaf with no children.
- No file in `content/` declares `features`, so `FeatureGrid` renders nothing today.

The content of those pages duplicates, in Vietnamese and by hand, what each repository's
README already says, and goes stale whenever a README changes. Release history is not
shown anywhere.

## 2. What GitHub actually holds (surveyed 2026-10-04)

| Group | README | Releases |
| --- | --- | --- |
| 7 apps with a public repo | all 7 | only `web-app-ducker` (4); the other 6 have **0** |
| 11 games with a repo | all 11 | all 11, between 12 and 24 each |
| `web-app-calculate-badminton` | **404** — private or wrong slug | 404 |
| Task Management, Tier List, Duck Strike | no `repo:` in frontmatter | — |

No README uses raw HTML. Several use **relative** links and images
(`docs/assets/screenshot.png`, `docs/README.md`), and every one opens with an H1 that
repeats the project name. Release bodies are git-cliff markdown.

## 3. Decisions taken in brainstorming

| # | Decision | Rejected |
| --- | --- | --- |
| D1 | The README **replaces** the hand-written body on every page whose entry has a `repo:`. Frontmatter stays the source of name, status, order, tagline, stack | Keeping both — two descriptions of one thing drift |
| D2 | Fetched at build time and refreshed by **ISR, at most once an hour** (`revalidate = 3600`) | Build-only (needs a redeploy per README edit); client-side fetch (60 req/h per viewer IP, no SEO, a loading state on every visit) |
| D3 | **Two URLs per entry**; the tabs are links: `/<group>/<slug>` (README) and `/<group>/<slug>/releases` | One URL with client tabs (24 release bodies in every page's HTML, TOC must swap on the client); `?tab=` (reading `searchParams` forces dynamic rendering, losing ISR) |
| D4 | Release tab lists **every** release, newest first, each in a `<details>`; only the newest open | Latest only; tag list without bodies |
| D5 | Games get the same shape as apps: an overview, a detail page with both tabs, children in the nav | Keeping R5 |
| D6 | `/apps` and `/games` are **overview pages**, the target of the top tabs and the first sidebar item ("Overview"), with the slugs below | Top tab opening the first entry; `/games` redirecting away |

## 4. Routes

| URL | Renders |
| --- | --- |
| `/[locale]/apps` · `/[locale]/games` | **Overview** — heading, one-line lede, count, card grid. Cards link to the detail page |
| `/[locale]/apps/<slug>` · `/[locale]/games/<slug>` | Hero + tab strip + **README** |
| `/[locale]/apps/<slug>/releases` · `/[locale]/games/<slug>/releases` | Hero + tab strip + **Releases** |

All six render inside `DocsShell` with the group's sidebar. The four detail routes
export `revalidate = 3600` and `generateStaticParams` over every locale × entry. Entries
with no `repo:` get no `/releases` route (`notFound()`).

## 5. Interface

**Sidebar.** Each group's first child is **Overview** (`/apps`, `/games`), then the
entries in `order`. `firstLeafHref` therefore points the top tab at the overview with no
change to `TopBar`.

**Overview.** Replaces both grids. One card component for apps and games: name, tagline,
status chip, stack; the whole card is one link to the detail page. `GameCard` is deleted.

**Detail page, middle column.**

1. `AppHero`, unchanged, now shared by games. Its repository link stays.
2. **Tab strip** `README · Releases` — two `<a>` in a `<nav aria-label>`; the current one
   carries `aria-current="page"`. Tokens from `MASTER.md`; no colour (ADR-0017).
3. The tab's content.

**README tab.** Rendered by the existing `renderMarkdown` (sanitised, raw HTML stripped),
after two transforms on the markdown tree:

- the **first H1 is dropped** — the hero already names the project;
- **relative URLs are absolutised**: links → `https://github.com/<owner>/<repo>/blob/<branch>/<path>`,
  images → `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>`. `./` and
  `../` resolve against the README's own directory. Absolute URLs, `mailto:` and
  `#anchors` are left alone.

TOC: the README's `##` headings, through the existing `buildToc` / `attachHeadingIds`.

**Releases tab.** One `<details>` per release, newest first, drafts excluded. Summary:
tag, name when it differs from the tag, date in the page's locale. Body: the release
notes through `renderMarkdown`. The first is `open`. TOC: one entry per release.

**States**, both with a link to GitHub:

| State | README tab | Releases tab |
| --- | --- | --- |
| `empty` | (cannot happen — a repo with no README is `unavailable`) | "No releases yet" + link to `<repo>/releases` |
| `unavailable` | "Could not load the README from GitHub" + link to the repo | "Could not load releases from GitHub" + link |

**Entries with no `repo:`** (Task Management, Tier List, Duck Strike): no tab strip; the
`.mdx` body renders as it does today. This is the one exception to D1 — without it those
three pages would be empty.

**Hidden on detail pages with a repo:** the `.mdx` body and `FeatureGrid`.

All new strings go through next-intl in both locales.

## 6. Data: `src/github/`

The only module that talks to GitHub — as `src/content/` is the only one that reads
`content/`. Public surface:

```ts
type Fetched<T> = { status: "ok"; data: T } | { status: "empty" } | { status: "unavailable" };

getReadme(repo: RepoRef): Promise<Fetched<{ markdown: string; branch: string; path: string }>>
getReleases(repo: RepoRef): Promise<Fetched<Release[]>>   // newest first, drafts dropped
parseRepoUrl(url: string): RepoRef | null                 // github.com/<owner>/<name> only
```

- `getReadme` calls `GET /repos/{o}/{r}/readme` with `Accept: application/vnd.github.raw+json`;
  `branch` and the README's `path` are parsed from `html_url`, so no extra call for the
  default branch.
- `getReleases` calls `GET /repos/{o}/{r}/releases?per_page=100`.
- **Never throws.** 404, 403/429 (rate limit), network error and malformed JSON all map
  to `unavailable`, and each logs one `console.warn` with the repo and the HTTP status.
- `GITHUB_TOKEN`, when set, is sent as `Authorization: Bearer`. Optional: added to
  `.env.example`; in CI it comes from `secrets.GITHUB_TOKEN`. One build makes about
  19 repos × 2 = 38 requests — under the anonymous 60/h, but close.

**Accepted cost.** A refresh that hits an error caches the `unavailable` state until the
next refresh (≤ 1 h). Simpler than keeping the last good copy, and the page still
renders.

**Host.** ISR needs a server; ADR-0022 deploys to Vercel. On a static-only host the
pages would update only on rebuild.

## 7. What does not change

- `content/**.mdx` files: none deleted. Their bodies still feed the **search index**,
  which stays file-built and never calls the network. README text is not searchable.
- `src/content/` remains the only door to `content/`.
- `pnpm build` still succeeds with no environment variable at all.

## 8. Documentation owed in the same branch

- **ADR-0023** — README and releases come from GitHub through ISR; amends ADR-0018 §2
  for entries with a `repo:`; records D2/D3's rejected alternatives.
- `scope.md`: **FR-25** README tab · **FR-26** Releases tab · **FR-27** games detail pages
  and the two overview pages.
- `invariants.md`: R5 retired; the new `src/github/` boundary.
- `glossary.md`: Overview · README tab · Releases tab.
- `README.md` `## Features`; `backlog.md` §In progress.

## 9. Testing

TDD, unit first.

- **`src/github/`** with `fetch` mocked: ok · empty (0 releases) · 404 · 403 rate limit ·
  network error · token present/absent · drafts dropped · newest first · branch and path
  parsed from `html_url` · `parseRepoUrl` rejects non-GitHub URLs.
- **URL absolutising**: relative link, relative image, `./`, `../`, a README in a
  subdirectory, absolute URL, `mailto:`, `#anchor`; first H1 dropped, later H1s kept.
- **Nav**: both groups start with Overview; games have children; `firstLeafHref` gives
  `/apps` and `/games`.
- **Boundary test**: no file under `src/` outside `src/github/` mentions
  `api.github.com` (ADR-0019 §4).
- **Components**: tab strip `aria-current`; release list with only the first `open`;
  empty and unavailable states.
- **E2E (Playwright)**: overview → detail → Releases tab and back; sidebar starts with
  Overview. In CI, GitHub is replaced by fixtures so the run does not depend on the
  network.
- Before claiming done: `pnpm test:run` · `typecheck` · `lint` · `build` · `e2e`.

## 10. Gates before code

1. **This spec** — approved by the user.
2. **UI mockup — approved by the user before any code is written.** Screens: overview,
   detail with README tab, detail with Releases tab (including the empty and unavailable
   states), each at 375 and 1440, built from `docs/design-system/ducker/MASTER.md`. An
   Artifact, not a file in this repository.
3. **Plan** — `docs/specs/github-readme-releases/plan.md`, written after the mockup is
   approved.

## 11. Open item

`web-app-calculate-badminton` returns 404. Until its `repo:` is corrected or the repo is
made public, its pages show the `unavailable` state — which is the correct rendering of
the fact, not a bug in this feature.
