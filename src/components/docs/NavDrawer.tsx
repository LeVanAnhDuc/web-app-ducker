"use client";

import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";

import type { NavTreeNode } from "@/content/nav-tree";
import { NavTree } from "./NavTree";
import styles from "./NavDrawer.module.css";

export type NavDrawerLabels = {
  /** Text on the open button, also the dialog's accessible name. */
  open: string;
  /** Text on the close button inside the drawer. */
  close: string;
};

export type NavDrawerProps = {
  /** Exactly the nodes the left column renders — same branch, same tree. */
  nodes: NavTreeNode[];
  /** Path of the current page, to mark the entry being viewed. */
  activeHref: string;
  /**
   * Translated labels. Defaults to Vietnamese so the component renders **bare**
   * in tests without a next-intl provider (same convention as `ThemeToggle`).
   */
  labels?: Partial<NavDrawerLabels>;
};

const DEFAULT_LABELS: NavDrawerLabels = {
  open: "Điều hướng tài liệu",
  close: "Đóng",
};

/** Everything clickable/tabbable inside the drawer, in DOM order. */
function focusablesIn(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return [
    ...root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ];
}

/**
 * Narrow-screen navigation drawer.
 *
 * On wide screens the left column is always visible, so **this button is hidden
 * entirely** by CSS. Below 980px the left column disappears and a `☰` button at
 * the top of the article takes its place. The previous version pushed the left
 * column to the **bottom of the page**: phone readers had to scroll through the
 * whole article to reach navigation, which amounts to having none.
 *
 * The tree inside is **the same `NavTree`** the left column uses, not a second
 * tree: two copies would drift apart by the third edit.
 *
 * The three duties of a real dialog, done exactly like `SearchDialog`:
 *
 * - `Esc` and clicking outside both close it;
 * - closing **returns focus to the open button**, otherwise keyboard users drop
 *   to `<body>` and lose their place;
 * - **focus trap** while open — `Tab` on the last element wraps to the first.
 *   Without the trap, Tab walks out behind the overlay to links the eye cannot
 *   see.
 */
export function NavDrawer({ nodes, activeHref, labels }: NavDrawerProps) {
  const text = { ...DEFAULT_LABELS, ...labels };

  const [open, setOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Focus follows the opening — the close button is the safest entry point,
  // since it is the way out and sits at the start of the Tab cycle.
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  // The background does not scroll while the drawer is open: if both layers
  // scroll, which one a finger drags is down to luck.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /** Closed focus loop inside the panel. */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }

    if (event.key !== "Tab") return;

    const items = focusablesIn(panelRef.current);
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  // No nodes means nothing to open — a `☰` button leading to an empty drawer is
  // worse than no button.
  if (nodes.length === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {/* `☰` is a text symbol (U+2630), not an emoji. */}
        <span className={styles.icon} aria-hidden="true">
          ☰
        </span>
        <span className={styles.label}>{text.open}</span>
        <span className={styles.caret} aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={panelRef}
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label={text.open}
            onKeyDown={onKeyDown}
          >
            <div className={styles.head}>
              <p className={styles.title}>{text.open}</p>
              <button ref={closeRef} type="button" className={styles.close} onClick={close}>
                {text.close}
              </button>
            </div>

            <div className={styles.body}>
              <NavTree nodes={nodes} activeHref={activeHref} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
