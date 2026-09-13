# ADR-0009 · The page states current reality, never the target architecture

> **Date:** 2026-08-17
> **Status:** accepted
> **Related:** US-01 · FR-01

## 1. Context

The ecosystem's documented design has Ducker ID as the identity provider and every other
app signing in through it. As of the survey on 2026-08-17, **no satellite app is
actually wired into it** — each still owns its own user model. A documentation site that
describes the plan as though it were the state of things is worse than no site.

## 2. Decision

The site distinguishes *what exists* from *what is planned*, and does it visually rather
than in a footnote. The ecosystem diagram encodes integration state in **line style**:
solid = connected, dashed = planned, none = standalone. Integration state is content a
human controls; the system never infers it.

The rule generalises into `design-rules.md` §7: **do not promise something that is not
there.**

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Draw the target architecture and add a caveat | Diagrams are read, captions are not |
| Hide unconnected apps | The site's job is the honest map, and most of the ecosystem would vanish |
| Derive integration state automatically | Nothing to derive it from — the provider exposes no registry endpoint |

## 4. Consequences

**Gained:** the diagram carries information rather than aspiration. The rule has since
blocked several concrete things: no drop zone on the media page when object storage is
unconfigured; an empty container cannot be published; an unfinished navigation entry
renders as dimmed text rather than a link to a 404; the "Reference" tab is not seeded
because it has no content.

**Lost / accepted:** the site looks less finished than a diagram of the target would.
That is the honest picture, and the design brief accepts it.

**Revisit when:** a satellite app genuinely completes OAuth integration — then it is a
content edit, not a code change.
