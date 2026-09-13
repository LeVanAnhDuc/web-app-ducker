/**
 * The `localStorage` key holding the theme choice.
 *
 * Carried over verbatim from the deleted `ThemeScript.tsx` so that no visitor
 * loses a stored preference: next-themes reads this key, and all three existing
 * value shapes migrate without a script.
 *
 * This file deliberately has no `"use client"`. Everything exported from a
 * client module becomes a client reference rather than a real string, and the
 * root layouts that configure the provider are server components.
 */
export const THEME_STORAGE_KEY = "ducker-theme";
