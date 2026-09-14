# Ducker — the front door to an app ecosystem, edited by committing a file

> The project's display name is **Ducker**, and the GitHub repository slug is
> `web-app-ducker` to match it. The original slug was `app-store-doc`; it survives
> only in git history and in migration names.

The public entry point to [@LeVanAnhDuc](https://github.com/LeVanAnhDuc)'s app
ecosystem: a landing page, a directory of every app and game, a detail page per
entry, and standalone documentation guides — a static site rendered from MDX
files in this repository.

Docs are one content type here, not the whole product. Apps, games and guides
are peers under `content/`, which is why the ecosystem showcase lives on this
site rather than in a separate app.

There is no database and no administration surface. Adding an app, editing a
description, or publishing a guide is an edit to a file under `content/` and a
push — see [ADR-0018](docs/decisions/0018-content-is-files-not-rows.md) and
[ADR-0019](docs/decisions/0019-no-administration-surface.md).

> **Status:** the application code is complete — **192 unit tests** pass
> (`pnpm test:run`), `tsc --noEmit` is clean, and `pnpm build` succeeds with
> **no environment variables at all**. `pnpm e2e` passes **16/16**.
> **Never deployed to Vercel**, but nothing blocks it any more — the deploy
> chain that used to wait on Neon/R2 credentials is gone with the CMS.

## Features

- **Public ecosystem pages**
  - A detail page per app — hero and body rendered from Markdown. The page
    also renders a feature grid, but no content file currently authors
    `features`, so it renders on no page yet
  - An ecosystem overview and standalone doc pages, each with its own
    detail page. Games have no detail page of their own — `/games` lists
    them with the same card treatment as an app, and each card links
    straight to its repository
  - A table of contents, a search dialog, and a sidebar navigation tree

- **A games section**
  - Duck-themed games are their own top-level group alongside apps and docs,
    listed on `/games` with the same card treatment as an app

- **Content is files, not an admin area**
  - No sign-in, no editor UI, no database. Every app, game and doc is one MDX
    file with frontmatter under `content/apps`, `content/games` or
    `content/docs` — a commit is the whole publishing flow
  - A sixth `status` value outside the five closed ones (`core` / `connected`
    / `standalone` / `planned` / `private`) fails the build instead of
    rendering an unstyled chip
  - A draft is a branch: Vercel's per-branch preview URL replaces the old
    secret-gated preview route

- **Navigation derived from content**
  - The nav tree's top level is hand-written (`content/nav.ts`); its children
    are derived from the app/game/doc files, so adding an entry never means
    editing the nav tree by hand

- **Multiple languages, honestly labelled**
  - Locale is a filename suffix (`<slug>.<locale>.mdx`), not a database row;
    the routing list lives in `src/i18n/locales.ts`, a hand-maintained
    constant the edge middleware imports directly
  - **Untranslated content falls back and says so** — a notice sits beside
    each entry that is showing another language, not once at the top of the
    page
  - Switching language and navigating both preserve the locale in the URL

- **Three-state theme toggle**
  - Light, dark, or follow the system — with no colour flash on first paint
  - The choice is remembered, stays in step across open tabs, and themes the
    browser's own controls — scrollbars, selects and autofill — not just the
    page

- **Mobile layout**
  - A navigation drawer for small screens, and a responsive shell shared by
    every public page

- **One door to the filesystem**
  - A component never reads `content/` directly. `src/content/` is the only
    place that touches the filesystem, parses frontmatter, and resolves
    locale fallback

## Tech Stack

Next.js 16 · next-intl · Vercel. No database, no auth layer, no object store.

Testing: Vitest (192 unit tests) and Playwright (16 e2e).

## Running

Needs Node 20+ and [pnpm](https://pnpm.io) 10 (`corepack enable pnpm`).

```bash
pnpm install               # install; nothing to generate, no environment needed
cp .env.example .env       # PowerShell: Copy-Item .env.example .env
pnpm dev                   # http://localhost:3000 → redirects to /vi
```

`pnpm build` succeeds with **no environment variables at all** — there is
nothing left to configure. `.env.example` lists two optional, non-secret
variables (an e2e port override, and a site URL nothing currently reads).

### Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next dev server |
| `pnpm build` | `next build` — reads content straight from `content/`, no prebuild step |
| `pnpm start` | Serve the build |
| `pnpm test` | Vitest in watch mode |
| `pnpm test:run` | Vitest once, `--maxWorkers=1` (parallel runs are flaky on Windows) |
| `pnpm typecheck` | `tsc --noEmit` — **vitest does not typecheck**, so always run this separately |
| `pnpm lint` | ESLint |
| `pnpm e2e` | Playwright. It starts its own server with `pnpm start`, so `pnpm build` first |

Every command needs no credentials at all — there are none left to need.

## Ecosystem

| Repo | Role |
|---|---|
| [`web-app-ducker-id`](https://github.com/LeVanAnhDuc/web-app-ducker-id) | Ducker ID — the IDMS: sign-in gateway and app launcher. The OAuth 2.0/OIDC provider itself is not built yet |
| [`web-app-match-cv`](https://github.com/LeVanAnhDuc/web-app-match-cv) | Matching a CV against a job description |
| [`web-app-manage-gym`](https://github.com/LeVanAnhDuc/web-app-manage-gym) | Training log |
| [`web-app-AI-study-coach`](https://github.com/LeVanAnhDuc/web-app-AI-study-coach) | Study assistant |
| [`web-app-AI-workflow-automation-platform`](https://github.com/LeVanAnhDuc/web-app-AI-workflow-automation-platform) | Ducker Flow Grid — visual workflow automation |
| [`app-calculate-badminton`](https://github.com/LeVanAnhDuc/app-calculate-badminton) | Splitting badminton court costs |
| [`web-app-shorten-link`](https://github.com/LeVanAnhDuc/web-app-shorten-link) | Link shortener |

The client and API halves of IDMS, CV matching and the link shortener each live
in one repository now — they used to be split into `client-…` and `api-…` pairs.

As of 17.08.2026, no satellite app is actually wired into IDMS yet.

## Documentation

| Task | Document |
|---|---|
| **Coming back to the project — where it stands, what is owed** | **[`docs/04-state/backlog.md`](docs/04-state/backlog.md) — open this first** |
| Why things are the way they are — 20 decisions, each with the alternatives rejected | [`docs/decisions/`](docs/decisions/README.md) |
| What breaks **silently** if you change it | [`docs/03-design/invariants.md`](docs/03-design/invariants.md) |
| Deploying, environment variables | [`docs/05-operations/runbook.md`](docs/05-operations/runbook.md) — ⚠️ largely pre-migration; its Neon/R2/Vercel deploy steps no longer apply |
| **Building any interface** | **[`docs/design-system/ducker/MASTER.md`](docs/design-system/ducker/MASTER.md) — mandatory** |
| Why the interface looks like that | [ADR-0017](docs/decisions/0017-ink-and-state-design-direction.md) — colour is reserved for status; the chrome carries none |
| Architecture, module boundaries, main data flow | [`docs/03-design/architecture.md`](docs/03-design/architecture.md) |
| What the product is for, and what it deliberately does not do | [`docs/01-product/overview.md`](docs/01-product/overview.md) |
| The full documentation map | [`docs/README.md`](docs/README.md) |
| Conventions for changing code in this repo | [`CLAUDE.md`](CLAUDE.md) |

> The two dated design specs and the two execution plans that used to live under
> `docs/superpowers/` were folded into the documents above on 2026-09-13 and deleted.
> They remain in git history.

## Content is authored in this repository

`content/apps/`, `content/games/` and `content/docs/` hold one MDX file per
entry per locale. Three entries — Tier List, Task Management, Duck Strike —
carry `status: planned` and no tagline rather than an invented one, because
their own projects have no description anywhere yet
([ADR-0009](docs/decisions/0009-the-page-states-current-reality.md)). Edit a
file, commit, push — there is no separate publishing step.
