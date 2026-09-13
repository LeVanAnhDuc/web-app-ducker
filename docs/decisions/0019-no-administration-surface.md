# ADR-0019 · There is no administration surface; editing is a commit

> **Date:** 2026-09-13
> **Status:** accepted
> **Related:** US-09 · retires FR-06 · FR-07 · FR-08 · FR-09 · FR-10 · FR-12 · FR-13 · FR-17 · FR-21 · supersedes ADR-0006 · ADR-0013 · ADR-0016

## 1. Context

`overview.md` §4 has said from the start that multiple users, roles and an audit log are
Non-Goals: one account owns the content. The CMS was nevertheless built for that one
account — 58 files of administration UI, a session layer, a media library, a
secret-gated draft preview, and language administration.

With content moving to files ([ADR-0018](0018-content-is-files-not-rows.md)) the CMS has
nothing left to write to.

## 2. Decision

Delete the administration surface outright rather than disabling it:
`src/app/[locale]/(admin)/**`, `src/components/admin/**`, `src/server/auth/`,
`src/server/media/`, and the dependencies `next-auth`, `bcryptjs`, `@aws-sdk/client-s3`.
Images move to `public/`. A draft becomes a branch, and Vercel's per-branch preview URL
replaces `PREVIEW_SECRET`.

`src/server/auth/boundary.test.ts` enforced `I9` — no component imports Prisma, Auth.js
or the S3 SDK. All three are gone, so the test has nothing left to guard and is deleted
with them; `I9` is retired in place.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Keep the admin behind a feature flag | Dead code that still typechecks, still has dependencies, still needs its secrets declared, and rots unobserved |
| Keep only the media library | It exists to record image dimensions on upload; frontmatter records them for free |
| Keep `PREVIEW_SECRET` for drafts | A branch preview is the same feature without a secret — and it retires `NFR-SEC-07`, whose refused preview wrongly answered 200 |
| Wait for Ducker ID's OAuth (FR-21) so the admin gets real auth | Builds an identity integration for a surface we are deleting |

## 4. Consequences

**Gained:** 82 fewer source files; eleven environment variables become none; the
`not-signed-in` class of bug disappears; `NFR-SEC-01` through `NFR-SEC-07` mostly become
vacuous because there is no mutation endpoint left to protect.

**Lost / accepted:**
- **No editing from a phone or a borrowed machine.** This is the real cost.
- **`ADR-0016`'s three doors collapse to one.** The boundary that a component never
  touches Prisma, Auth.js or S3 is no longer enforced by a test, because none of the
  three is a dependency any more. If a server dependency ever returns, the test must
  return with it — this is the invariant most likely to be lost quietly.
- `US-04` … `US-08` describe flows that no longer exist. They are retired in place.

**Revisit when:** a second editor appears, or content must be changed by someone who
cannot clone the repository.
