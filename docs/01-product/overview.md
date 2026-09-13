# Product overview

> **Answers:** What is this product, who is it for, and what does it deliberately **NOT** do?
> **Status:** 🟢 complete
> **Updated:** 2026-09-13 · commit b2d70a8
> **Update when:** the positioning changes · a Non-Goal is added or dropped · the cost ceiling changes

<!-- HOW TO FILL
This is the ONLY file that answers "is this in scope". Every scope argument ends here.

Section 4 (Non-Goals) is the most important and the most often left empty. A good
Non-Goal is something that sounds REASONABLE and is still refused.

DOES NOT CONTAIN: the feature inventory (-> 02-requirements/scope.md), technical
thresholds (-> 02-requirements/nfr.md), terminology (-> 01-product/glossary.md).
-->

## 1. One-sentence positioning

Ducker is the documentation site for the `github.com/LeVanAnhDuc` app ecosystem, plus
the CMS that edits it — one place where every app explains what it is, how to run it
and how it connects to the identity provider, editable **without a code change and
without a redeploy**.

## 2. The problem being solved

The ecosystem is eight-plus repositories that each explain themselves only in their own
README. There is no page that says how they relate, which of them actually talk to the
identity provider today, and how a new app joins. A static site would answer that once
and then rot: the original request was *"a docs page"* and changed mid-brainstorm to
*"I want a CMS"* — precisely because the content has to move faster than deploys.

## 3. Target users

| Group | Situation | What they need |
| --- | --- | --- |
| **Primary — the ecosystem owner** | writing or correcting content about their own apps | edit anything from a browser, see it live immediately |
| A developer joining an app | reading before writing code | what each app is, its stack, how to run it, how OAuth integration is meant to work |
| A visitor / reviewer | browsing a portfolio | an honest map of what exists and what is still planned |

Bilingual Vietnamese/English from day one; the architecture is open to a third language
(see [ADR-0003](../decisions/0003-locale-as-row-not-column.md)).

## 4. Non-Goals — deliberately not built

- **Multiple users, role-based permissions, an edit audit log.** One account owns the
  content. Anything more is machinery with no second person to use it.
- **Comments, feedback, visitor analytics.** This is a reference, not a community.
- **Automatic content sync from each repo's README.** README quality varies and the
  sync would have to guess structure; a human writing through the CMS is both simpler
  and more accurate.
- **Changing the identity provider to support OAuth client registration.** Out of this
  repo's control — it belongs to Ducker ID.
- **A block-based rich editor.** The data model leaves the door open
  ([ADR-0005](../decisions/0005-section-body-as-tagged-json.md)) but the editor is
  markdown for now.
- **Nested URLs that mirror the navigation tree.** See
  [ADR-0007](../decisions/0007-flat-urls-tree-controls-navigation-only.md).
- **Web fonts.** See [ADR-0008](../decisions/0008-system-fonts-only-georgia-banned.md).

## 5. Model

| Question | Answer |
| --- | --- |
| Who pays | Nobody — personal portfolio / learning project |
| Paid with what | — |
| **Infrastructure cost ceiling / month** | **$0** — every dependency must have a usable free tier: Neon free, Cloudflare R2 free (10 GB), Vercel Hobby. This ceiling is why the stack looks the way it does; it drives [ADR-0002](../decisions/0002-postgres-on-neon-with-prisma.md), [ADR-0004](../decisions/0004-ssg-with-tag-revalidation.md) and [ADR-0013](../decisions/0013-cloudflare-r2-for-images.md). |

⚠️ Vercel Hobby forbids commercial use. Going commercial means moving to Pro — a cost
decision, not a technical one.

## 6. What success looks like

1. **Editing content in the CMS changes the public page with no deploy.** Proven by
   `e2e/content-roundtrip.spec.ts` against a real database, not asserted.
2. **The page tells the truth about integration state.** No satellite app is actually
   wired into the identity provider yet, and the ecosystem diagram says so with line
   style rather than hiding it — see
   [ADR-0009](../decisions/0009-the-page-states-current-reality.md).
3. **A new app can be added entirely through the CMS** — no migration, no redeploy.
   The single exception is adding a new *language*, which needs one redeploy
   (see [`nfr.md`](../02-requirements/nfr.md) and architecture §6).
