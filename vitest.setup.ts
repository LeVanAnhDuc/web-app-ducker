// Loads the DOM matchers for every component test.
import "@testing-library/jest-dom/vitest";

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// With `globals: false`, Testing Library cannot register its cleanup itself:
// it only hooks into `afterEach` when that is available in the global scope.
// Without the line below, every `render()` piles onto `document.body` and every
// `screen` query from the second test on also sees the previous test's DOM.
afterEach(cleanup);

// jsdom does not implement `window.matchMedia`, and next-themes calls it the
// moment its provider mounts. Without this stub every theme component test dies
// on "matchMedia is not a function" before reaching an assertion.
// `matches: false` means "the OS is in light mode" — tests that care about the
// dark branch set the stored choice explicitly instead of emulating the OS.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
