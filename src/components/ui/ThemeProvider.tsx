"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { THEME_STORAGE_KEY } from "./theme-config";

/**
 * The theme provider, configured once for both root layouts.
 *
 * `attribute="data-theme"` is next-themes' own default and happens to be
 * exactly what `tokens.css` binds to, which is why this migration moves no CSS
 * at all.
 *
 * In system mode next-themes writes the RESOLVED value rather than leaving the
 * attribute absent, so `:root[data-theme="dark"]` is the block that matches.
 * The `@media (prefers-color-scheme: dark)` block in `tokens.css` is still what
 * honours the operating system when JavaScript is disabled — do not delete it.
 *
 * `enableColorScheme` is left at its default `true`: it sets
 * `documentElement.style.colorScheme`, which is what themes the scrollbars,
 * `<select>` and autofill. Nothing in `src/styles/` sets that property, which
 * is the defect this migration exists to fix.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      storageKey={THEME_STORAGE_KEY}
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
