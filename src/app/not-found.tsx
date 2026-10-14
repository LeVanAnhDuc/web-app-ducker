import { defaultLocale } from "@/i18n/locales";
import messages from "@/i18n/messages/vi.json";

import styles from "./[locale]/status.module.css";

/**
 * 404 page for paths that match no route, including those outside `[locale]`.
 *
 * Why this file exists alongside `[locale]/not-found.tsx`: a URL that does not
 * match `[locale]` (e.g. `/does-not-exist`) lands in the root not-found boundary.
 * The root layout only passes `children` through and has no `<html>`/`<body>`, so
 * without this file Next returns its default 404 — HTML without even an `<html>` tag.
 *
 * No `getLocale()`: `setRequestLocale` has not run here, so calling it would read
 * headers and drag every static page in the tree into dynamic rendering. A path
 * that matches no route has no locale to infer anyway, so use the default directly.
 */
export default function RootNotFound() {
  return (
    <html lang={defaultLocale}>
      <body>
        <main className={styles.wrap}>
          <p className={styles.code}>404</p>
          <h1 className={styles.title}>{messages.notFound.title}</h1>
          <p className={styles.body}>{messages.notFound.body}</p>
          <a className={styles.action} href={`/${defaultLocale}`}>
            {messages.notFound.backHome}
          </a>
        </main>
      </body>
    </html>
  );
}
