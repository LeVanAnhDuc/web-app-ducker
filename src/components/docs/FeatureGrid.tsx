import styles from "./FeatureGrid.module.css";

/**
 * One feature, straight off frontmatter (`AppDetail.features` in `@/content`).
 *
 * There is no per-feature `locale`/`isFallback` any more: a feature is not its
 * own translated record (that was ADR-0005's `Feature` + `FeatureTranslation`
 * pair), it is one entry in a frontmatter array inside a single per-locale
 * file. Fallback is a whole-document property now, already shown once by
 * `AppHero`'s `FallbackNotice` — repeating it per feature would just say the
 * same thing N times.
 */
export type Feature = { title: string; description: string | null; icon: string | null };

export type FeatureGridProps = {
  features: Feature[];
  /** Tiêu đề khối, đã dịch. Ví dụ "Tính năng". */
  title: string;
};

/**
 * Lưới tính năng của trang ứng dụng (mockup màn 02, `.m-feats`).
 *
 * Không tính năng nào thì không dựng tiêu đề "Tính năng" cho một khối trống.
 */
export function FeatureGrid({ features, title }: FeatureGridProps) {
  if (features.length === 0) return null;

  return (
    <section className={styles.block}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.grid}>
        {features.map((feature, index) => (
          <article className={styles.card} key={`${feature.title}-${index}`}>
            <h3 className={styles.name}>{feature.title}</h3>
            {feature.description ? <p className={styles.desc}>{feature.description}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
