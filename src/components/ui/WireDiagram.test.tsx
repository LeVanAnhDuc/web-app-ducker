// src/components/ui/WireDiagram.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { WireDiagram } from "./WireDiagram";

const items = [
  { name: "Ducker ID",     desc: "Đăng nhập",  integration: "core" as const },
  { name: "Match CV",           desc: "Đối chiếu",  integration: "planned" as const },
  { name: "Calculate Badminton",desc: "Chia tiền",  integration: "standalone" as const },
];

describe("WireDiagram", () => {
  it("shows the display name, not the slug", () => {
    render(<WireDiagram items={items} coreLabel="IDMS" />);
    expect(screen.getByText("Calculate Badminton")).toBeInTheDocument();
    expect(screen.queryByText("app-calculate-badminton")).toBeNull();
  });

  it("solid line for connected, dashed for planned, no line for standalone", () => {
    const { container } = render(<WireDiagram items={items} coreLabel="IDMS" />);
    const leads = container.querySelectorAll("[data-integration]");
    expect(leads[0].getAttribute("data-integration")).toBe("core");
    expect(leads[1].getAttribute("data-integration")).toBe("planned");
    expect(leads[2].getAttribute("data-integration")).toBe("standalone");
  });

  it("always includes a legend — line styles mean nothing unexplained", () => {
    render(<WireDiagram items={items} coreLabel="IDMS" />);
    expect(screen.getByRole("list", { name: /chú giải/i })).toBeInTheDocument();
  });

  it("renders an empty list without crashing", () => {
    const { container } = render(<WireDiagram items={[]} coreLabel="IDMS" />);
    expect(container.querySelectorAll("[data-integration]")).toHaveLength(0);
  });
});
