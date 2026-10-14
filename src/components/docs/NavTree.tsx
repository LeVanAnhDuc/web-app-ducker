"use client";

import { useId, useState } from "react";

import { findTrail, type NavTreeNode } from "@/content/nav-tree";
import styles from "./NavTree.module.css";

export type NavTreeProps = {
  /** Sibling nodes at the outermost level. Empty renders nothing. */
  nodes: NavTreeNode[];
  /** Path of the current page, locale prefix included — matches a leaf's `href` exactly. */
  activeHref: string;
};

/**
 * Public navigation tree.
 *
 * Two kinds of element, deliberately different HTML tags:
 *
 * - **A container node is a `<button>`**, not a link. A `CONTAINER` has no URL
 *   of its own: clicking it only expands/collapses. Rendered as `<a href="#">`,
 *   a screen reader announces "link", the user clicks and waits for a page that
 *   never comes, and Ctrl+click opens an empty tab.
 * - **A leaf node is an `<a>`**, not a toggle. It really goes somewhere, so it
 *   must open in a new tab, have a copyable address, and show in the status bar
 *   on hover.
 *
 * `aria-expanded` is the only thing telling a screen reader whether a branch is
 * expanded; the `▾ ▸` arrows are for the eye only, hence `aria-hidden`.
 */
export function NavTree({ nodes, activeHref }: NavTreeProps) {
  /**
   * Stores **only what the user clicked**, not the full expanded state.
   *
   * Effective state = the user's choice if any, otherwise "the branch holding the
   * current page is expanded". So moving to another page in the same tree
   * (client-side navigation, the component is not remounted) still expands the
   * right new branch, while a branch the user deliberately collapsed does not
   * pop open again.
   */
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  /**
   * A per-instance prefix for each child list's `id`.
   *
   * This tree is now rendered **twice on the same page**: once in the left
   * column, once in the narrow-screen drawer. Using plain `nav-${node.id}`, both
   * copies would share `id`s and one copy's `aria-controls` would point at the
   * other's element — invalid DOM, and screen readers follow whichever `id` they
   * find first.
   */
  const uid = useId();

  const onTrail = new Set(findTrail(nodes, activeHref).map((node) => node.id));

  const toggle = (id: string, expanded: boolean) =>
    setToggled((current) => ({ ...current, [id]: !expanded }));

  if (nodes.length === 0) return null;

  const renderList = (siblings: NavTreeNode[], depth: number, id?: string) => (
    <ul className={styles.list} data-depth={depth} id={id}>
      {siblings.map((node) => {
        if (node.kind !== "CONTAINER") {
          // A leaf with an empty `href` is invalid data. Drop the entry: a link
          // to `undefined` looks like real data.
          if (node.href === null) return null;

          const current = node.href === activeHref;
          return (
            <li key={node.id}>
              <a
                className={styles.item}
                href={node.href}
                // The current entry is marked with aria-current; the pill is only a consequence.
                aria-current={current ? "page" : undefined}
              >
                <span className={styles.marker} aria-hidden="true" />
                {node.label}
              </a>
            </li>
          );
        }

        const expanded = toggled[node.id] ?? onTrail.has(node.id);
        const listId = `nav-${uid}-${node.id}`;

        return (
          <li key={node.id}>
            <button
              type="button"
              className={`${styles.item} ${styles.container}`}
              aria-expanded={expanded}
              aria-controls={expanded && node.children.length > 0 ? listId : undefined}
              onClick={() => toggle(node.id, expanded)}
            >
              <span className={styles.marker} aria-hidden="true">
                {expanded ? "▾" : "▸"}
              </span>
              {node.label}
            </button>
            {expanded && node.children.length > 0
              ? renderList(node.children, depth + 1, listId)
              : null}
          </li>
        );
      })}
    </ul>
  );

  return renderList(nodes, 0);
}
