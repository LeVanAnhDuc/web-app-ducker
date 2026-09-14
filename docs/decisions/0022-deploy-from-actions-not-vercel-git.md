# ADR-0022 · CI gates the deploy, and GitHub Actions ships it

> **Date:** 2026-09-14
> **Status:** accepted
> **Related:** ADR-0021 · NFR-REL-04 · ADR-0018

## 1. Context

Until now this repository had no CI: nothing ran `pnpm typecheck`, `pnpm lint`,
`pnpm test:run`, `pnpm build` or `pnpm e2e` on a pull request. The only automated
check was commit-subject formatting ([ADR-0021](0021-versions-and-notes-derive-from-commits.md)),
which says nothing about whether the code works. It has also **never been deployed** —
there is no Vercel project yet.

Two things made the gap concrete rather than theoretical, both found on 2026-09-14
while installing the release automation:

- `pnpm test:run` **did not finish at all.** `vitest.config.mts` overrode the default
  `**/node_modules/**` exclusion with a root-only pattern, so vitest walked
  `.worktrees/next-themes/node_modules/` and silently ran thousands of dependency test
  files. The symptom was a hang, never a red test.
- The build is the only thing that proves the two dynamic route handlers ship
  `content/**` at all, and nothing was running it.

Both would have merged unnoticed. Whatever ships next therefore has to be gated by
something that actually runs.

## 2. Decision

**One workflow, `.github/workflows/ci.yml`, contains both the checks and the deploy.**
Jobs `static` (typecheck · lint · unit tests) and `e2e` (build · Playwright) run on
every pull request and every push to `main`. Job `deploy` declares
`needs: [static, e2e]` and runs only on a push to `main`.

Deployment is `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt`,
driven from Actions with three repository secrets, rather than letting Vercel's Git
integration deploy on push.

The CLI version is pinned exactly (`VERCEL_CLI_VERSION`), for the same reason
ADR-0021 pins git-cliff: an upstream behaviour change must not silently alter what
ships.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Vercel's Git integration, on its own | **It does not read GitHub checks.** It deploys on push whether or not anything passed, which is the exact failure this ADR exists to close. Its preview URLs per PR are a real loss, taken deliberately |
| Deploy in a separate `deploy.yml`, gated by `workflow_run` | `workflow_run` fires on failure too unless you remember to test `conclusion == 'success'`. Forgetting it reads exactly like a green pipeline while shipping code no check ever passed. `needs:` cannot be forgotten in that way |
| `next build` + upload the output ourselves | Would ship a broken site that looks fine. `outputFileTracingIncludes` in `next.config.ts` forces `content/**` into two handlers' bundles, and only Vercel's own build applies it — see §4 |
| GitHub Pages, no third-party token | Impossible. `src/middleware.ts` does locale routing and two handlers (`/api/search-index/[locale]`, `/[locale]/n/[id]`) read the filesystem at request time. This is not a fully static site, whatever the one-line description says |
| Keep CI out of it and deploy by hand | The thing being protected against is a silent failure. A human step is exactly what silent failures survive |

## 4. Consequences

**Gained:**
- Nothing reaches production without typecheck, lint, 192 unit tests, a real build and
  16 e2e tests passing first.
- The `e2e` job sets **no environment variables at all**, so NFR-REL-04 ("builds with
  nothing configured") is enforced continuously rather than asserted.
- A failed e2e run uploads its Playwright trace, so a CI-only failure is debuggable
  without reproducing it locally.

**Lost / accepted:**
- **`VERCEL_TOKEN` is a long-lived credential in repository secrets**, and it can
  deploy any project in the account. Vercel's GitHub App would have used a narrower
  grant. This is the real price of the decision.
- **No preview deployment per pull request.** The Git integration gives those away;
  wiring them in Actions is extra work that has not been done.
- **The project is built twice** on a push to `main` — once by the `e2e` job, once by
  `vercel build`. Unavoidable: `vercel build` is what produces `.vercel/output`, and
  §the tracer argument above means it cannot be skipped.
- **Two deploys will fire per push if Vercel's Git integration is also connected**,
  and the ungated one can land last. Turning it off is a manual step in the Vercel
  dashboard, recorded in the runbook §6.3, and nothing in this repository can enforce
  it.
- Linking the project once, by hand, is still required: `VERCEL_ORG_ID` and
  `VERCEL_PROJECT_ID` do not exist until then. Actions does not remove the dashboard
  step, it only moves what happens afterwards.

**Revisit when:** preview deployments per pull request become worth building, or
Vercel offers a deploy credential scoped to one project.
