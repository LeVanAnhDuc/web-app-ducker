"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { fuzzyMatch } from "@/lib/fuzzy";
import type { SearchDoc } from "@/lib/search-index";
import styles from "./SearchDialog.module.css";

/** Long enough for a suggestion list that fits on one screen. */
const MAX_RESULTS = 8;

/**
 * Index state. It starts as `loading`: nobody sees this state before the dialog
 * opens, so there is no need for an `idle` branch just to describe "not fetched
 * yet" — whether the fetch has happened is tracked by `loadedFor`.
 */
type IndexState =
  | { phase: "loading" }
  | { phase: "ready"; docs: SearchDoc[] }
  | { phase: "error" };

export type SearchDialogProps = {
  /** The index is split per locale; also the prefix of every `href` in the results. */
  locale: string;
};

/**
 * Search box of the top bar.
 *
 * The index loads **lazily**: `GET /api/search-index/<locale>` runs only when the
 * user first opens the dialog. Preloading it on page render would make every
 * reader pay the bandwidth for a feature most never use.
 *
 * Filtering runs in the browser via `fuzzyMatch`, so typing makes no network
 * calls, and diacritic-free search ("tap luyen" finds "tập luyện") works the way
 * Vietnamese users type quickly.
 */
export function SearchDialog({ locale }: SearchDialogProps) {
  const t = useTranslations("search");

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<IndexState>({ phase: "loading" });

  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  /** Locale whose index has loaded — also the guard against fetching twice. */
  const loadedFor = useRef<string | null>(null);
  const resultsId = useId();

  /** Opening after a failure must clear the old error message, or it lingers in plain view. */
  const clearStaleError = useCallback(() => {
    setIndex((current) => (current.phase === "error" ? { phase: "loading" } : current));
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the button that opened the dialog: if closing with Esc
    // drops focus to <body>, keyboard users lose their place.
    triggerRef.current?.focus();
  }, []);

  // ⌘K / Ctrl+K shortcut, exactly as the button label says.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((previous) => !previous);
        clearStaleError();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearStaleError]);

  // Load the index exactly once, and only once the dialog is open.
  useEffect(() => {
    if (!open || loadedFor.current === locale) return;
    loadedFor.current = locale;

    let cancelled = false;

    fetch(`/api/search-index/${locale}`)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<SearchDoc[]>;
      })
      .then((docs) => {
        if (!cancelled) setIndex({ phase: "ready", docs });
      })
      .catch(() => {
        // On failure, say so and show how to retry rather than swallowing the
        // error and leaving the search box inexplicably idle. Release the guard
        // so the next open really fetches again.
        loadedFor.current = null;
        if (!cancelled) setIndex({ phase: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [open, locale]);

  // Focus follows the opening.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results =
    index.phase === "ready" ? fuzzyMatch(query, index.docs, MAX_RESULTS) : [];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen(true);
          clearStaleError();
        }}
      >
        <span>{t("open")}</span>
        <kbd className={styles.kbd}>{t("shortcut")}</kbd>
      </button>

      {open ? (
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label={t("label")}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                close();
              }
            }}
          >
            <div className={styles.field}>
              <input
                ref={inputRef}
                className={styles.input}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("placeholder")}
                aria-label={t("label")}
                aria-controls={resultsId}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" className={styles.close} onClick={close}>
                {t("close")}
              </button>
            </div>

            <div className={styles.body} id={resultsId} aria-live="polite">
              {index.phase === "loading" ? <p className={styles.note}>{t("loading")}</p> : null}
              {index.phase === "error" ? <p className={styles.note}>{t("error")}</p> : null}

              {index.phase === "ready" && query.trim() === "" ? (
                <p className={styles.note}>{t("hint")}</p>
              ) : null}

              {index.phase === "ready" && query.trim() !== "" && results.length === 0 ? (
                <p className={styles.note}>{t("empty")}</p>
              ) : null}

              {results.length > 0 ? (
                <ul className={styles.results}>
                  {results.map((doc) => (
                    <li key={doc.href}>
                      <a className={styles.result} href={doc.href} onClick={() => setOpen(false)}>
                        <span className={styles.resultTitle}>{doc.title}</span>
                        <span className={styles.resultHref}>{doc.href}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
