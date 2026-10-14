import { getRequestConfig } from "next-intl/server";

import { defaultLocale, locales } from "./locales";
import en from "./messages/en.json";
import vi from "./messages/vi.json";

/**
 * UI strings are loaded statically, never through a variable dynamic `import()`.
 *
 * The strings ship with the code, so the bundler must see both files at build
 * time. Loading them dynamically by locale name drops them from the edge bundle
 * and the page renders without text.
 */
const messagesByLocale: Record<string, typeof vi> = { vi, en };

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  // `requestLocale` can be `undefined` (a page outside `[locale]`) or a junk
  // value, because `[locale]` also catches stray paths. Both fall back to the default.
  const locale =
    requested && locales.includes(requested) ? requested : defaultLocale;

  // A locale added to `locales` before it has a UI strings file borrows the
  // default set — content still renders in the right language, only the button labels lag.
  const messages = messagesByLocale[locale] ?? vi;

  return { locale, messages };
});
