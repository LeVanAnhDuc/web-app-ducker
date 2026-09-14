import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/markdown";
import { MarkdownBody } from "./MarkdownBody";

const labels = { code: "Khối mã", table: "Bảng dữ liệu" };

const BODY_MD =
  "Cần Node 20.\n\n```bash\nnpm install\n```\n\n| Tên | Bắt buộc |\n|---|---|\n| API_SERVER_URL | Có |";

describe("MarkdownBody", () => {
  it("dựng lại đúng văn xuôi đã kết xuất từ markdown", async () => {
    const html = await renderMarkdown(BODY_MD);
    render(<MarkdownBody html={html} labels={labels} />);
    expect(screen.getByText("Cần Node 20.")).toBeInTheDocument();
  });

  it("khối mã và bảng nằm trong hộp cuộn riêng — thân trang không cuộn ngang", async () => {
    const html = await renderMarkdown(BODY_MD);
    render(<MarkdownBody html={html} labels={labels} />);

    expect(screen.getByRole("region", { name: "Khối mã" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Bảng dữ liệu" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("một khối mã chỉ có một điểm dừng Tab, không phải hai", async () => {
    const html = await renderMarkdown(BODY_MD);
    const { container } = render(<MarkdownBody html={html} labels={labels} />);
    expect(container.querySelectorAll("pre[tabindex]")).toHaveLength(0);
  });
});
