import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/globals.css";

import { siteUrl } from "@/lib/site-url";

/**
 * Every page's `canonical` and `hreflang` alternates are relative paths; this turns
 * them into absolute URLs on the real host instead of whatever Next would guess.
 */
export const metadata: Metadata = {
  metadataBase: siteUrl(),
};

/**
 * The root layout only passes `children` on — it does **not** render `<html>`/`<body>`.
 *
 * The `lang` attribute has to follow the path's locale, and the `[locale]` param is
 * only readable from a layout inside `src/app/[locale]/`. So `<html>`/`<body>` live
 * in `src/app/[locale]/(public)/layout.tsx` — the App Router's "multiple root
 * layouts" pattern.
 *
 * The file still has to exist: it loads `globals.css` and `metadataBase` for the
 * whole route tree.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
