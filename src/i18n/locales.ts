// The locale list, written by hand. It used to be generated from the `Locale`
// table (ADR-0015); that table is gone (ADR-0018, ADR-0019), so this is a plain
// constant, like `content/nav.ts`.
//
// The proxy (`src/proxy.ts`) imports it directly on every request. Adding a
// language still means editing this file and redeploying.

export const locales: readonly string[] = ["vi", "en"];
export const defaultLocale: string = "vi";
