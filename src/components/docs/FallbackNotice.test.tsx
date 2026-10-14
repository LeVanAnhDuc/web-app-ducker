import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FallbackNotice } from "./FallbackNotice";

describe("FallbackNotice", () => {
  it("states clearly that another locale's version is shown", () => {
    render(<FallbackNotice shownLocale="vi" wantedLocale="en" label="Chưa có bản tiếng Anh" />);
    expect(screen.getByText("Chưa có bản tiếng Anh")).toBeInTheDocument();
  });
  it("renders nothing when the locale matches", () => {
    const { container } = render(<FallbackNotice shownLocale="vi" wantedLocale="vi" label="x" />);
    expect(container).toBeEmptyDOMElement();
  });
});
