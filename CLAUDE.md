# Ducker

Ecosystem documentation site — a static site whose content is files in this repository.
Display name: **Ducker**. Repository slug: `web-app-ducker` (renamed from `app-store-doc` on 2026-08-20).
Next.js 16 · next-intl · Vercel. There is no database, no auth layer and no object
store — see [ADR-0018](docs/decisions/0018-content-is-files-not-rows.md) and
[ADR-0019](docs/decisions/0019-no-administration-surface.md).

> This file is the **code-facing** half of the instructions. The process half —
> documentation contract, feature workflow, hooks, skill routing — lives in
> `.claude/CLAUDE.md`, which is gitignored and therefore absent from a fresh clone.
> Where the two overlap: **this file decides what the code looks like, that one decides
> how the work is done.**

## Read before you start

| Task | Document |
| --- | --- |
| **Starting a session — where things stand, what is owed** | **[`docs/04-state/backlog.md`](docs/04-state/backlog.md) — read this first** |
| **Before reversing a decision, or when code looks strange** | [`docs/decisions/`](docs/decisions/README.md) — 20 ADRs, each with the alternatives that were rejected |
| **Before changing any line of code** | [`docs/03-design/invariants.md`](docs/03-design/invariants.md) — what breaks *silently* |
| **Building any interface** | [`docs/design-system/ducker/MASTER.md`](docs/design-system/ducker/MASTER.md) — **required**. The token source of truth |
| Why the interface looks like that | [ADR-0017](docs/decisions/0017-ink-and-state-design-direction.md) — colour is reserved for status; the chrome has none |
| Architecture, data model, module boundaries | [`docs/03-design/architecture.md`](docs/03-design/architecture.md) — ⚠️ predates the file-backed migration; describes deleted systems (Prisma/Auth.js/R2) |
| Scope — is this in or out? | [`docs/01-product/overview.md`](docs/01-product/overview.md) §Non-Goals · [`docs/02-requirements/scope.md`](docs/02-requirements/scope.md) |
| Naming a new concept | [`docs/01-product/glossary.md`](docs/01-product/glossary.md) — it locks names |
| Deploy, environment variables | [`docs/05-operations/runbook.md`](docs/05-operations/runbook.md) — ⚠️ largely pre-migration; the deploy steps for Neon/R2/Vercel it describes no longer apply |

The full map is [`docs/README.md`](docs/README.md).

## Commands

```bash
pnpm install --frozen-lockfile   # install; nothing to generate, no environment needed
pnpm dev               # http://localhost:3000 → redirects to /vi
pnpm test:run          # vitest, --maxWorkers=1
pnpm typecheck         # tsc --noEmit
pnpm lint
pnpm build             # no environment variables required — content is read from `content/`
pnpm e2e               # Playwright, on its own port 3210
```

The build needs no environment at all: there is no database, no secret, and no object
store to configure. `.env.example` lists only two optional, non-secret variables.

## One boundary that must not be crossed

A component **never** reads the filesystem directly. `src/content/` is the only door:
it reads `content/**.mdx`, parses frontmatter, resolves locale fallback, and is the
only module every page imports content through. Nothing else touches `content/` or
`fs`. Reasoning: [ADR-0018](docs/decisions/0018-content-is-files-not-rows.md).

⚠️ Until 2026-09-13 this was **three** boundaries — `src/server/content/` (Prisma),
`src/server/auth/` (Auth.js) and `src/server/media/` (the S3 SDK), enforced by
`src/server/auth/boundary.test.ts` — deleted along with the database, the admin
surface and the object store ([ADR-0019](docs/decisions/0019-no-administration-surface.md)
§4). If a server dependency ever returns, an enforcing test must return with it.

## Three known traps

1. **`vitest` does not typecheck.** A green suite does not prove `tsc` is clean. Always
   run `pnpm typecheck` separately, and `pnpm build` before claiming completion.
2. **Parallel vitest is flaky on this Windows machine.** A failure under a parallel run
   is not a real failure until it repeats with `--maxWorkers=1`. Component tests use
   `fireEvent`, never `userEvent.type`.
3. **A content file's `status` must be one of five closed values** (`core` /
   `connected` / `standalone` / `planned` / `private`, `src/content/frontmatter.ts`). A
   sixth value fails the build rather than rendering an unstyled chip.

The rest of the silent-failure list is in
[`docs/03-design/invariants.md`](docs/03-design/invariants.md) — the file to read
before editing code.

## Application names

Display names are capitalised with spaces: **Manage Gym**, not `web-app-manage-gym`. The
repository slug appears only in a secondary role, in mono type, coloured `--ink-soft`. Full
mapping table in `docs/design-system/ducker/MASTER.md` §5.

## README (REQUIRED — keep in sync with features)

`README.md` describes what the app does for its users — it is not a boilerplate page.
Every commit that adds or changes user-facing behaviour (`feat:`) MUST update the
`## Features` section of `README.md` in the same branch, before merging — one short
English bullet in the existing style.

While touching README, refresh any stale numbers you notice (test counts, stack
versions).

README-only documentation commits use a `docs:` prefix.

## Language

Everything is written in English: product content, code comments, commit messages,
documentation, and identifiers in code.

One documentation file is still Vietnamese in the body and carries an English header
only — `docs/05-operations/runbook.md`. It is
flagged in `docs/README.md` §Language, not silently mixed. So are the Vietnamese
reminder strings emitted by the hooks in `.claude/scripts/`, which are addressed to the
model mid-session and never appear in the repository's output.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
