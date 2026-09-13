"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import { useTheme } from "next-themes";

import styles from "./ThemeToggle.module.css";

/**
 * Three states, not two. `tokens.css` has three theme blocks, and "follow the
 * system" is the one most visitors are in — a two-state toggle cuts off the
 * route back to the default. Guarded by invariant I16.
 */
export type ThemeChoice = "system" | "light" | "dark";

/**
 * Labels are passed in rather than read with `useTranslations` inside: the
 * component has to render bare, with no `NextIntlClientProvider`. Same
 * convention as `OrderControls`, `AppCard`, `AppHero`.
 */
export type ThemeToggleLabels = Record<ThemeChoice, string> & {
  /** Label for the group of three, read out by screen readers. */
  group: string;
};

export type ThemeToggleProps = {
  labels: ThemeToggleLabels;
};

/** Symbols drawn as SVG — design-rules section 5 forbids emoji as symbols. */
const ICONS: Record<ThemeChoice, ReactElement> = {
  system: (
    <>
      <rect x="2" y="3.2" width="12" height="8.6" rx="1.5" />
      <path d="M6.2 14h3.6" />
    </>
  ),
  light: (
    <>
      <circle cx="8" cy="8" r="2.9" />
      <path d="M8 1.1v1.5M8 13.4v1.5M1.1 8h1.5M13.4 8h1.5M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1" />
    </>
  ),
  dark: <path d="M13.4 9.7A5.8 5.8 0 0 1 6.3 2.6 5.9 5.9 0 1 0 13.4 9.7Z" />,
};

const CHOICES: ThemeChoice[] = ["system", "light", "dark"];

/**
 * "Has this component hydrated yet?", expressed as a store React already knows
 * how to read differently on the server and on the client.
 *
 * The obvious spelling is a boolean state set from an effect, but
 * `react-hooks/set-state-in-effect` bans it, and rightly: it renders twice for
 * something React can answer directly. Nothing here ever changes, so subscribing
 * hands back a no-op unsubscribe. All three are module-level constants because a
 * fresh `subscribe` identity on every render would resubscribe on every render.
 */
const subscribeToNothing = () => () => {};
const isMountedOnClient = () => true;
const isMountedOnServer = () => false;

/**
 * The theme switch — three joined buttons, the same shape as the language
 * switch in `TopBar`.
 *
 * All state lives in the `ThemeProvider` above it: next-themes owns the
 * pre-paint script, the `localStorage` write, the `storage` event that keeps
 * other tabs in step, and `documentElement.style.colorScheme`. This component
 * only reports which of the three is active and asks for a different one.
 */
export function ThemeToggle({ labels }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  // The server cannot read `localStorage`, and next-themes seeds its state from
  // it on the client's very first render — so reading `theme` during hydration
  // is a mismatch. Reporting "system" until mounted reproduces exactly what the
  // hand-rolled version rendered, and the real choice lands immediately after.
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    isMountedOnClient,
    isMountedOnServer,
  );

  const choice: ThemeChoice =
    mounted && (theme === "dark" || theme === "light") ? theme : "system";

  return (
    <div className={styles.group} role="group" aria-label={labels.group}>
      {CHOICES.map((value) => (
        <button
          key={value}
          type="button"
          className={styles.button}
          // `aria-pressed`, not `aria-current`: these are three mutually
          // exclusive toggles, not three navigation links.
          aria-pressed={choice === value}
          aria-label={labels[value]}
          title={labels[value]}
          onClick={() => setTheme(value)}
        >
          <svg
            className={styles.icon}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            {ICONS[value]}
          </svg>
        </button>
      ))}
    </div>
  );
}
