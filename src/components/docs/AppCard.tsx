import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import type { AppCard as AppCardRow } from "@/content";
import styles from "./AppCard.module.css";

/**
 * Dữ liệu một thẻ ứng dụng — hình dạng `AppCard` của `@/content` (ADR-0018),
 * đọc thẳng từ frontmatter. Không còn `status` biên tập (nháp / đã đăng / lưu
 * trữ) để lược bỏ: file-backed content không có trạng thái đó (R14).
 */
export type AppCardData = AppCardRow;

export type AppCardProps = {
  app: AppCardData;
  /** Tiền tố ngôn ngữ của mọi liên kết trong thẻ. */
  locale: string;
  /**
   * Nhãn huy hiệu trạng thái, **đã dịch**. Không có nhãn thì không dựng huy
   * hiệu: thà thiếu huy hiệu còn hơn hiện tên khoá kỹ thuật cho người đọc.
   */
  statusLabel?: string;
  /** Nhãn liên kết repo, đã dịch. Ví dụ "Xem trên GitHub". */
  repoLabel?: string;
};

/**
 * Thẻ ứng dụng trong lưới trang chủ. Hình khối chép từ `.m-card` của mockup.
 *
 * Bất biến quan trọng nhất (design-rules §1): **tên hiển thị là tiêu đề, slug
 * repo chỉ là chữ mono phụ**. Slug không bao giờ được leo vào thẻ tiêu đề.
 *
 * `role="listitem"` is an ARIA role, not a tag change: the card stays an
 * `<article>` (unchanged CSS), but the card grids it sits in (home, `/apps`)
 * are semantically lists, and e2e/registry.spec.ts asserts on that role.
 */
export function AppCard({ app, locale, statusLabel, repoLabel }: AppCardProps) {
  // Repo riêng tư thì không dựng liên kết: bấm vào chỉ ra trang 404 của GitHub.
  const repoHref = !app.isRepoPrivate && app.repoUrl ? app.repoUrl : null;

  return (
    <article className={styles.card} role="listitem">
      <div className={styles.top}>
        <h3 className={styles.name}>
          <a className={styles.nameLink} href={`/${locale}/apps/${app.slug}`}>
            {app.name}
          </a>
        </h3>
        {statusLabel ? <Badge kind={app.integration}>{statusLabel}</Badge> : null}
      </div>

      <p className={styles.slug}>
        {repoHref && repoLabel ? (
          <a
            // `nameLink` first: it only contributes `display`/`min-height` here (its
            // `color` loses the cascade to `slugLink`'s own, later rule), reused
            // rather than invented to reach the 24px tap target (WCAG 2.2 SC 2.5.8)
            // now that this link exists on the list pages too — the old CMS-backed
            // card never populated `repoUrl` here, so this anchor did not render
            // before ADR-0018.
            className={`${styles.nameLink} ${styles.slugLink}`}
            href={repoHref}
            aria-label={`${repoLabel}: ${app.slug}`}
            rel="noreferrer"
            target="_blank"
          >
            {app.slug}
          </a>
        ) : (
          app.slug
        )}
      </p>

      {app.tagline ? (
        <p className={styles.tagline} data-testid="tagline">
          {app.tagline}
        </p>
      ) : null}

      {app.techStack.length > 0 ? (
        <div className={styles.chips}>
          {app.techStack.map((tech) => (
            <Chip key={tech}>{tech}</Chip>
          ))}
        </div>
      ) : null}
    </article>
  );
}
