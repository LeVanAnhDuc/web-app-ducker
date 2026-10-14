import styles from "./FallbackNotice.module.css";

export type FallbackNoticeProps = {
  /** Actual locale of the content being shown. */
  shownLocale: string;
  /** Locale the reader requested (the path's locale). */
  wantedLocale: string;
  /** Notice text, already translated. */
  label: string;
};

/**
 * "You are reading another locale's version" notice.
 *
 * Placed next to **each** section and **each** feature rather than once at the
 * top of the page: translations are completed unevenly, so one page can mix
 * translated and untranslated sections. A page-level notice would misstate most
 * of the content below it.
 *
 * When the locale matches, nothing is rendered — adding a "fully translated"
 * line to every section would only dilute the page.
 */
export function FallbackNotice({ shownLocale, wantedLocale, label }: FallbackNoticeProps) {
  if (shownLocale === wantedLocale) return null;

  return (
    // No `lang` here: the notice is written in the reader's chosen language;
    // only the content below belongs to `shownLocale`.
    <p className={styles.notice}>
      {/* The locale code is a visual cue; the text beside it is the content —
          screen readers only need the text. */}
      <span className={styles.code} aria-hidden="true">
        {shownLocale}
      </span>
      <span className={styles.label}>{label}</span>
    </p>
  );
}
