import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import type { ReactElement } from "react";

import { ThemeToggle } from "./ThemeToggle";
import { ThemeProvider } from "./ThemeProvider";
import { THEME_STORAGE_KEY } from "./theme-config";

const labels = {
  group: "Theme",
  system: "Follow system",
  light: "Light",
  dark: "Dark",
};

// The toggle reads its state from the provider, so every test mounts both.
function renderToggle(ui: ReactElement = <ThemeToggle labels={labels} />) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
});

describe("ThemeToggle", () => {
  it("offers three states, not two — losing 'follow system' loses the way back", () => {
    renderToggle();
    expect(screen.getAllByRole("button")).toHaveLength(3);
    for (const name of [labels.system, labels.light, labels.dark]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("starts on 'follow system' when nothing was ever chosen", () => {
    renderToggle();
    expect(screen.getByRole("button", { name: labels.system })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it('choosing dark sets data-theme="dark", the third block of tokens.css', () => {
    renderToggle();
    fireEvent.click(screen.getByRole("button", { name: labels.dark }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: labels.dark })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it('choosing light sets data-theme="light" so the @media block stops matching', () => {
    renderToggle();
    fireEvent.click(screen.getByRole("button", { name: labels.light }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("a manual choice is persisted under the key the old implementation used", () => {
    renderToggle();
    fireEvent.click(screen.getByRole("button", { name: labels.dark }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("returning to 'follow system' stores the literal system, and presses that button", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderToggle();
    fireEvent.click(screen.getByRole("button", { name: labels.system }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    expect(screen.getByRole("button", { name: labels.system })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("restores a stored choice on mount", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    renderToggle();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(screen.getByRole("button", { name: labels.light })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("a junk stored value does not produce a junk theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "neon");
    renderToggle();
    expect(screen.getByRole("button", { name: labels.system })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("all three are real keyboard-usable buttons", () => {
    renderToggle();
    for (const button of screen.getAllByRole("button")) {
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("type", "button");
    }
  });

  it("labels the group for screen readers", () => {
    renderToggle();
    expect(screen.getByRole("group", { name: labels.group })).toBeInTheDocument();
  });

  it("uses drawn SVG symbols, not emoji, and no literal colours", () => {
    const { container } = renderToggle();
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{6}/i);
    expect(container.innerHTML).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
