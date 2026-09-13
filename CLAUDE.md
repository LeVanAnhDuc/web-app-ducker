# Ducker

Ecosystem documentation site + content management back office.
Display name: **Ducker**. Repository slug: `web-app-ducker` (renamed from `app-store-doc` on 2026-08-20).
Next.js 16 · Prisma 7 · PostgreSQL (Neon) · Auth.js · next-intl · Cloudflare R2 · Vercel

> This file is the **code-facing** half of the instructions. The process half —
> documentation contract, feature workflow, hooks, skill routing — lives in
> `.claude/CLAUDE.md`, which is gitignored and therefore absent from a fresh clone.
> Where the two overlap: **this file decides what the code looks like, that one decides
> how the work is done.**

## Read before you start

| Task | Document |
| --- | --- |
| **Starting a session — where things stand, what is owed** | **[`docs/04-state/backlog.md`](docs/04-state/backlog.md) — read this first** |
| **Before reversing a decision, or when code looks strange** | [`docs/decisions/`](docs/decisions/README.md) — 17 ADRs, each with the alternatives that were rejected |
| **Before changing any line of code** | [`docs/03-design/invariants.md`](docs/03-design/invariants.md) — what breaks *silently* |
| **Building any interface** | [`docs/design-system/ducker/MASTER.md`](docs/design-system/ducker/MASTER.md) — **required**. The token source of truth |
| Why the interface looks like that | [ADR-0017](docs/decisions/0017-ink-and-state-design-direction.md) — colour is reserved for status; the chrome has none |
| Architecture, data model, module boundaries | [`docs/03-design/architecture.md`](docs/03-design/architecture.md) |
| Scope — is this in or out? | [`docs/01-product/overview.md`](docs/01-product/overview.md) §Non-Goals · [`docs/02-requirements/scope.md`](docs/02-requirements/scope.md) |
| Naming a new concept | [`docs/01-product/glossary.md`](docs/01-product/glossary.md) — it locks names |
| Deploy, environment variables, database-backed tests | [`docs/05-operations/runbook.md`](docs/05-operations/runbook.md) |

The full map is [`docs/README.md`](docs/README.md).

## Commands

```bash
pnpm install --frozen-lockfile   # install; postinstall runs `prisma generate`
pnpm dev               # http://localhost:3000 → redirects to /vi
pnpm test:run          # vitest, --maxWorkers=1
pnpm typecheck         # tsc --noEmit
pnpm lint
pnpm build             # prebuild generates the locale list
pnpm e2e               # Playwright, on its own port 3210
```

⚠️ **The Prisma CLI does not read `.env`** — nor do vitest, tsx or Playwright's config
loader by default. Only Next does. Pass the variable inline:
`DATABASE_URL="…" pnpm exec prisma migrate deploy`. Without it Prisma falls back to the
placeholder in `prisma.config.ts` and fails with `P1010`, which looks like a permissions
problem and is actually the wrong database.

## Three boundaries that must not be crossed

A component **never** imports Prisma, Auth.js, or the S3 SDK. Every access goes through
exactly one door:

- `src/server/content/` — the only place that touches Prisma
- `src/server/auth/` — the only place that knows Auth.js. Exposes only `getCurrentUser()`, `requireAdmin()`, `signOut()`
- `src/server/media/` — the only place that knows Cloudflare R2

`src/server/auth/boundary.test.ts` enforces this by scanning the source, so a violation
fails the suite rather than waiting to be noticed. Reasoning: [ADR-0016](docs/decisions/0016-three-doors-enforced-by-test.md).

## Four known traps

1. **A server action is its own HTTP endpoint.** Guarding `/admin`'s `layout.tsx` does
   *not* guard the action. Every writing action calls `await requireAdmin()` on its
   first line.
2. **`vitest` does not typecheck.** A green suite does not prove `tsc` is clean. Always
   run `pnpm typecheck` separately, and `pnpm build` before claiming completion.
3. **Parallel vitest is flaky on this Windows machine.** A failure under a parallel run
   is not a real failure until it repeats with `--maxWorkers=1`. Component tests use
   `fireEvent`, never `userEvent.type`.
4. **There is only one `test` database branch** and `prisma migrate reset` empties it.
   Never run two suites at once.

The rest of the silent-failure list is in
[`docs/03-design/invariants.md`](docs/03-design/invariants.md) — 17 entries, and it is
the file to read before editing code.

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
