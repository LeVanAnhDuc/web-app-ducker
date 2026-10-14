import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import type { AppDetail } from "@/content";
import { FallbackNotice } from "./FallbackNotice";
import styles from "./AppHero.module.css";

export type AppHeroLabels = {
  /** Integration status badge, already translated. */
  status: string;
  privateRepo: string;
  repo: string;
  /** Notice that the reader is seeing another locale's version. */
  fallback: string;
};

export type AppHeroProps = {
  app: AppDetail;
  /** Locale the reader requested, compared against the content's actual locale. */
  locale: string;
  /** Breadcrumb path, e.g. "Ứng dụng / Lõi". */
  crumb: string;
  labels: AppHeroLabels;
  /**
   * Slot rendered **right below the tagline**, before the metadata row.
   *
   * Exactly one use: the narrow-screen navigation drawer button (`NavDrawer`),
   * which belongs here — after the title, before the content. Placed outside
   * `AppHero`, right after this element, it lands at y=639 on a 375×667
   * viewport, i.e. **below the fold** — measured, not guessed: the metadata row
   * (slug, badges, tech chips, repo link) is 114px tall and the summary 84px,
   * and both sit in between.
   */
  drawer?: ReactNode;
};

/**
 * App page header.
 *
 * Invariant: **the display name is the `h1`, the repo slug is secondary mono
 * text in the metadata row**. The slug never climbs into the `h1`.
 *
 * A private repo gets no link — clicking it would only reach GitHub's 404 page —
 * but a badge stating plainly that the repo is private.
 *
 * ADR-0018: `AppDetail` no longer carries `apiRepoUrl`, `demoUrl` or `summary` —
 * those belonged to the CMS editor, which the next task removes along with the
 * fields themselves. The hero now shows exactly what the frontmatter has: one
 * repo link, one tagline.
 */
export function AppHero({ app, locale, crumb, labels, drawer }: AppHeroProps) {
  const showRepoLinks = !app.isRepoPrivate;
  // If the integration status already says "private repo", skip it: no two
  // badges saying the same thing.
  const showPrivateBadge = app.isRepoPrivate && app.integration !== "private";

  return (
    <header className={styles.hero}>
      <p className={styles.crumb}>{crumb}</p>
      <h1 className={styles.title}>{app.name}</h1>

      <FallbackNotice shownLocale={app.locale} wantedLocale={locale} label={labels.fallback} />

      {app.tagline ? <p className={styles.tagline}>{app.tagline}</p> : null}

      {drawer}

      <div className={styles.meta}>
        <span className={styles.slug}>{app.slug}</span>
        <Badge kind={app.integration}>{labels.status}</Badge>
        {showPrivateBadge ? <Badge kind="private">{labels.privateRepo}</Badge> : null}

        {app.techStack.map((tech) => (
          <Chip key={tech}>{tech}</Chip>
        ))}

        <span className={styles.spacer} />

        {showRepoLinks && app.repoUrl ? (
          <a className={styles.link} href={app.repoUrl} rel="noreferrer" target="_blank">
            {labels.repo}
          </a>
        ) : null}
      </div>
    </header>
  );
}
