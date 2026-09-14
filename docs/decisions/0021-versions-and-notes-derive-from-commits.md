# ADR-0021 · The version and the release notes are derived from commit subjects

> **Date:** 2026-09-14
> **Status:** accepted
> **Related:** ADR-0018 · ADR-0019

## 1. Context

This repository had **no release mechanism at all** — no tag, no
`.github/workflows/`, no changelog. 50 commits had accumulated with nothing marking
what shipped when, and the ecosystem's other repositories each answered this
differently: hand-written bash under `.github/scripts/`, GitHub's
`--generate-notes`, or nothing. A reader comparing two products could not tell
whether a version number meant the same thing in both.

Two workspace skills already exist for this, `commit-rule` and `release-note`, and
both are installed in other repositories. The question was not what to build but
whether to adopt them here, and on what terms.

The repository's own history sets one relevant constraint: 45 of its 50 commits
already follow Conventional Commits. The remaining 5 are `update`, `update doc`, and
three merge commits. So the input the mechanism needs was already being produced, by
habit rather than by enforcement.

## 2. Decision

**Both the version and the notes are computed from commit subjects**, by
[git-cliff](https://git-cliff.org), on every push to `main`. No file stores a version
number and no human writes a release note.

Three pieces, in dependency order:

- `.githooks/commit-msg` + `.github/workflows/commit-lint.yml` — Conventional Commits
  1.0.0, the 11 shared types plus `design` at slot 04, declared in
  `.githooks/commit-types`. `design` is declared because this repository has genuinely
  used it, 5 times; the workspace's other repositories that never used it do not
  declare it.
- `cliff.toml` — **generated** from that type list, never hand-written. The buckets in
  the notes are a one-to-one image of the types the hook accepts, so neither can drift
  from the other.
- `.github/workflows/release.yml` — reads the whole commit range since the last tag,
  and publishes the GitHub Release.

`1.0.0` is unreachable by accident: `breaking_always_bump_major = false` means a
breaking change bumps **minor** while the major is still 0, and only an explicit
`[release major]` marker crosses to 1.0.0. That is a claim about completeness and it
should cost a deliberate act.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| commitlint + husky | Needs `node_modules` in every repository to enforce a rule that is pure string matching. The workspace has a Go repository and a Python one where Node is foreign; a shell hook runs identically in all of them |
| semantic-release | Owns publishing, tagging, changelog and npm release as one unit. This repository publishes no package — only a Vercel deploy — so most of it would be dead weight, and its version rules are harder to preview than `pnpm release:next` |
| GitHub's `--generate-notes` | Groups by pull request, not by change type, and cannot express "this was breaking". It also says nothing about the version number, which is the half that actually has to be decided |
| Hand-written bash, as some sibling repositories have | ~200 lines per repository to maintain, and the existing copies carried a real bug: they read release markers from `HEAD`'s subject, which under a PR flow is always GitHub's `Merge pull request #N` boilerplate, so a marker in the real commit never arrived |
| Keep writing notes by hand | The version and the notes are two statements about the same thing. Written separately they eventually disagree, and nothing detects it |

## 4. Consequences

**Gained:**
- A version number that cannot contradict its own release notes — both read one source.
- Release markers (`[release major]` · `[release minor]` · `[skip release]`) that work
  under the PR flow, because the workflow reads `git log --no-merges "$latest..HEAD"`
  rather than `HEAD`'s subject.
- The command CI runs is the command you run: `pnpm release:next` and
  `pnpm release:notes` reproduce the CI result at your desk.

**Lost / accepted:**
- **An external dependency where there was none**, fetched by `pnpm dlx` both locally
  and in CI. The version is pinned (`GIT_CLIFF_VERSION`) so an upstream behaviour
  change cannot silently alter how this repository is versioned.
- **The first release, `v0.1.0`, covers all 50 commits at once** and its notes are
  partly in Vietnamese — the early history predates the English-only rule. That is
  history and it is left as written.
- Two commits (`update`, `update doc`) land in the *Other* bucket forever. No tool can
  fix subjects written before the rule existed.
- `git config core.hooksPath .githooks` is local configuration and cannot be committed,
  so it must be re-run after every clone. That is exactly why the CI check exists and
  why it must not be dropped as redundant.

**Revisit when:** this repository has something to publish beyond a Vercel deploy — a
package, an installer — at which point the release job does more than write notes.
