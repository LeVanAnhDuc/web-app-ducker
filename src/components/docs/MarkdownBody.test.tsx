import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/markdown";
import { MarkdownBody } from "./MarkdownBody";

const labels = { code: "Khối mã", table: "Bảng dữ liệu" };

const BODY_MD =
  "Cần Node 20.\n\n```bash\nnpm install\n```\n\n| Tên | Bắt buộc |\n|---|---|\n| API_SERVER_URL | Có |";

describe("MarkdownBody", () => {
  it("renders the prose produced from markdown", async () => {
    const html = await renderMarkdown(BODY_MD);
    render(<MarkdownBody html={html} labels={labels} />);
    expect(screen.getByText("Cần Node 20.")).toBeInTheDocument();
  });

  it("code blocks and tables sit in their own scroll box — the page body never scrolls sideways", async () => {
    const html = await renderMarkdown(BODY_MD);
    render(<MarkdownBody html={html} labels={labels} />);

    expect(screen.getByRole("region", { name: "Khối mã" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Bảng dữ liệu" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("a code block has one Tab stop, not two", async () => {
    const html = await renderMarkdown(BODY_MD);
    const { container } = render(<MarkdownBody html={html} labels={labels} />);
    expect(container.querySelectorAll("pre[tabindex]")).toHaveLength(0);
  });
});
