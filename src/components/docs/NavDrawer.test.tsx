import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { NavDrawer } from "./NavDrawer";

const nodes = [
  {
    id: "sat",
    kind: "CONTAINER" as const,
    label: "Vệ tinh",
    href: null,
    isFallback: false,
    children: [
      {
        id: "a",
        kind: "APP" as const,
        label: "Match CV",
        href: "/vi/apps/match-cv",
        isFallback: false,
        children: [],
      },
    ],
  },
];

/** The Vietnamese default label, exactly what the component uses when the caller passes none. */
const OPEN_LABEL = "Điều hướng tài liệu";

function renderDrawer() {
  return render(<NavDrawer nodes={nodes} activeHref="/vi/apps/match-cv" />);
}

/** The `☰` button — queried by label, not by CSS class. */
function trigger() {
  return screen.getByRole("button", { name: new RegExp(OPEN_LABEL) });
}

describe("NavDrawer", () => {
  it("when closed, there is only the open button and no dialog covering the content", () => {
    renderDrawer();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).toBeNull();
    // Tree not rendered: a link while closed would mean it is hiding somewhere in the page.
    expect(screen.queryByRole("link", { name: "Match CV" })).toBeNull();
  });

  it("clicking the open button shows the drawer, and the tree inside is the real NavTree", () => {
    renderDrawer();
    fireEvent.click(trigger());

    const dialog = screen.getByRole("dialog", { name: OPEN_LABEL });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    // Container nodes are toggle <button>s and leaf nodes are <a> — NavTree's
    // contract, so this is the real tree rather than a hand-copied list.
    expect(screen.getByRole("button", { name: /Vệ tinh/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("link", { name: "Match CV" })).toHaveAttribute(
      "href",
      "/vi/apps/match-cv",
    );
  });

  it("Esc closes the drawer", () => {
    renderDrawer();
    fireEvent.click(trigger());
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("clicking outside closes the drawer", () => {
    const { container } = renderDrawer();
    fireEvent.click(trigger());

    // The overlay is the panel's parent; only a click on it closes.
    const overlay = screen.getByRole("dialog").parentElement!;
    fireEvent.mouseDown(overlay);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(container.querySelector("[role=dialog]")).toBeNull();
  });

  it("a click INSIDE the panel does NOT close it — otherwise expanding any branch would collapse the drawer", () => {
    renderDrawer();
    fireEvent.click(trigger());
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closing with Esc returns focus to the open button", () => {
    renderDrawer();
    const button = trigger();
    fireEvent.click(button);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(document.activeElement).toBe(button);
  });

  it("closing with the Close button also returns focus to the open button", () => {
    renderDrawer();
    const button = trigger();
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(document.activeElement).toBe(button);
  });

  it("focus follows the opening — the Close button receives focus immediately", () => {
    renderDrawer();
    fireEvent.click(trigger());
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Đóng" }));
  });

  it("focus trap: Tab on the last element wraps to the first", () => {
    renderDrawer();
    fireEvent.click(trigger());

    const dialog = screen.getByRole("dialog");
    const focusables = [...dialog.querySelectorAll<HTMLElement>("a[href], button")];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    expect(first).not.toBe(last);

    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(first);
  });

  it("focus trap: Shift+Tab on the first element wraps to the last", () => {
    renderDrawer();
    fireEvent.click(trigger());

    const dialog = screen.getByRole("dialog");
    const focusables = [...dialog.querySelectorAll<HTMLElement>("a[href], button")];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("Tab in the middle of the cycle is left to the browser, focus is not hijacked", () => {
    renderDrawer();
    fireEvent.click(trigger());

    const dialog = screen.getByRole("dialog");
    const focusables = [...dialog.querySelectorAll<HTMLElement>("a[href], button")];
    const middle = focusables[1];
    middle.focus();

    const handled = fireEvent.keyDown(dialog, { key: "Tab" });
    // `fireEvent` returns false when preventDefault was called.
    expect(handled).toBe(true);
    expect(document.activeElement).toBe(middle);
  });

  it("the symbol is ☰, not an emoji", () => {
    renderDrawer();
    expect(trigger().textContent).toContain("☰");
    // Basic emoji range: no character of the button may fall in it.
    expect(trigger().textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  it("takes labels via props rather than translating internally", () => {
    render(
      <NavDrawer
        nodes={nodes}
        activeHref="/vi/apps/match-cv"
        labels={{ open: "Documentation navigation", close: "Close" }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Documentation navigation/ }));
    expect(screen.getByRole("dialog", { name: "Documentation navigation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("renders not even the open button when there are no nodes", () => {
    const { container } = render(<NavDrawer nodes={[]} activeHref="/vi" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("writes no hard-coded colour values", () => {
    const { container } = renderDrawer();
    fireEvent.click(trigger());
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{6}/i);
  });
});
