// Nạp matcher DOM cho mọi test component.
import "@testing-library/jest-dom/vitest";

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// `globals: false` nên Testing Library không tự đăng ký được dọn dẹp:
// nó chỉ móc vào `afterEach` khi biến này có sẵn ở phạm vi toàn cục.
// Thiếu dòng dưới, mỗi `render()` cộng dồn vào `document.body` và mọi truy vấn
// qua `screen` ở test thứ hai trở đi sẽ thấy cả DOM của test trước.
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
