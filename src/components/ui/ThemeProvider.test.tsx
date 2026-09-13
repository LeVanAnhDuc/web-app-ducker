import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import { ThemeProvider } from "./ThemeProvider";
import { THEME_STORAGE_KEY } from "./theme-config";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
});

describe("ThemeProvider", () => {
  it("renders its children", () => {
    render(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("applies a stored choice to data-theme, the attribute tokens.css binds to", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  // This is the gap the whole migration exists to close: without it the
  // scrollbars and native controls stay light on a dark page.
  it("sets color-scheme so native browser UI follows the theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });
});
