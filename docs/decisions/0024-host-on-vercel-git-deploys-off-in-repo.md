# ADR-0024 · Host on Vercel, with its Git deploys switched off from the repository

> **Date:** 2026-10-10
> **Status:** accepted
> **Related:** NFR-PERF-05 · NFR-REL-04 · amends ADR-0022 · ADR-0023

## 1. Context

ADR-0022 wired a Vercel deploy job into `ci.yml`, but the host itself stayed undecided
from 2026-09-14: the job skipped on every push and the site was never deployed. GitHub
Pages was the other candidate. ADR-0022 §3 calls Pages "impossible", which overstates
it — it is possible, at a price that ADR-0023 then raised: four pages now set
`revalidate = 3600` so each entry's README and releases refresh hourly, and a static
host has no ISR.

ADR-0022 §4 also left one hole open: if the Vercel Git integration is ever connected —
and `vercel link` offers to connect it — every push deploys twice, the ungated copy
possibly last, and "nothing in this repository can enforce" turning it off.

## 2. Decision

**The site is hosted on Vercel, deployed only by the `deploy` job in `ci.yml`.** A
root `vercel.json` sets `"git": { "deploymentEnabled": false }`, so Vercel creates no
deployment from a Git push on any branch even if the integration is connected. CLI
deployments (`vercel deploy --prebuilt`) are unaffected. `GITHUB_TOKEN` is a Vercel
project variable for production, because the hourly refreshes run on Vercel, not in
CI.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| GitHub Pages | Needs `output: 'export'`: `src/middleware.ts` goes, so `/` can no longer negotiate a locale from `Accept-Language` and always lands on `/vi`; `/api/search-index/[locale]` becomes a build-time file, contradicting NFR-PERF-05 (needs its own ADR); `/[locale]/n/[id]` becomes static pages; and the hourly README/releases refresh needs a scheduled rebuild workflow in its place |
| Turn Git deploys off in the Vercel dashboard only (runbook §6.3 as written) | A setting outside the repository, invisible in review, lost if the project is recreated. The file costs six lines and is reviewed like code |
| Keep deferring the host | The pipeline, the release automation and #12's ISR all exist to serve a live site; none of them has run against one |

## 4. Consequences

**Gained:**
- The double-deploy trap of ADR-0022 §4 is closed by a file, not by a manual step.
- Every runtime feature keeps working unchanged: locale negotiation, the two
  filesystem-reading handlers, the hourly ISR refresh.

**Lost / accepted:**
- Everything ADR-0022 §4 already accepted still holds: a long-lived `VERCEL_TOKEN` in
  repository secrets, no preview deployment per pull request, two builds per push to
  `main`.
- `deploymentEnabled: false` also forbids Git *preview* deployments. Getting PR previews
  later means a CI job, not re-enabling the integration.
- The site depends on one vendor, on the Hobby plan's terms (personal, non-commercial).

**Revisit when:** the site must run without a third-party host, or Vercel's Git
integration can be gated on GitHub checks reliably enough to replace the CLI job.
