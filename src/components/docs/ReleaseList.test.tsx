import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReleaseList } from "./ReleaseList";

const r = (tag: string, over: Partial<{ name: string | null; html: string }> = {}) => ({
  tag,
  name: null,
  dateLabel: "13 thg 9, 2026",
  anchor: `release-${tag}`,
  html: "<p>notes</p>",
  ...over,
});

describe("ReleaseList", () => {
  it("opens only the newest release", () => {
    const { container } = render(
      <ReleaseList releases={[r("v1.6.8"), r("v1.6.7"), r("v1.6.6")]} latestLabel="Mới nhất" bodyLabels={{ code: "Mã", table: "Bảng" }} />,
    );
    const details = container.querySelectorAll("details");
    expect(details).toHaveLength(3);
    expect([...details].map((d) => d.open)).toEqual([true, false, false]);
  });

  it("labels the newest as latest and gives every release its anchor", () => {
    const { container } = render(<ReleaseList releases={[r("v1.6.8"), r("v1.6.7")]} latestLabel="Mới nhất" bodyLabels={{ code: "Mã", table: "Bảng" }} />);
    expect(screen.getAllByText("Mới nhất")).toHaveLength(1);
    expect(container.querySelector('[id="release-v1.6.7"]')).not.toBeNull();
  });

  it("shows a distinct name beside the tag, and nothing for an empty body", () => {
    const { container } = render(
      <ReleaseList releases={[r("v2.0.0", { name: "Hot-seat", html: "" })]} latestLabel="Mới nhất" bodyLabels={{ code: "Mã", table: "Bảng" }} />,
    );
    expect(screen.getByText("Hot-seat")).toBeInTheDocument();
    expect(container.textContent).not.toContain("undefined");
  });

  it("renders the notes as prose, so lists keep their markers", () => {
    const { container } = render(
      <ReleaseList
        releases={[r("v1.0.0", { html: "<ul><li>deps: x</li></ul>" })]}
        latestLabel="Mới nhất"
        bodyLabels={{ code: "Mã", table: "Bảng" }}
      />,
    );
    // MarkdownBody wraps prose in the `.prose` block that restores list-style.
    expect(container.querySelector('[class*="prose"] ul')).not.toBeNull();
  });
});
