import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SpendingChart, { formatYAxis } from "../SpendingChart";
import type { CategorySpending } from "@/lib/types";

// recharts uses ResizeObserver which jsdom doesn't support
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

const mockData: CategorySpending[] = [
  { categoryName: "Food", total: 1500000, count: 20 },
  { categoryName: "Transport", total: 800000, count: 15 },
  { categoryName: "Health", total: 300000, count: 5 },
];

describe("formatYAxis", () => {
  it("formats millions", () => {
    expect(formatYAxis(1_500_000)).toBe("1.5M");
  });

  it("formats thousands", () => {
    expect(formatYAxis(800_000)).toBe("800K");
  });

  it("returns raw value for small numbers", () => {
    expect(formatYAxis(500)).toBe("500");
  });
});

describe("SpendingChart", () => {
  it("shows empty state when data is empty", () => {
    render(<SpendingChart data={[]} currency="Rp" />);
    expect(screen.getByText(/No spending data/i)).toBeInTheDocument();
  });

  it("renders the chart heading when data is present", () => {
    render(<SpendingChart data={mockData} currency="Rp" />);
    expect(screen.getByText("Spending by Category")).toBeInTheDocument();
  });
});
