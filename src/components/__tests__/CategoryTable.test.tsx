import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CategoryTable from "../CategoryTable";
import type { CategorySpending } from "@/lib/types";

const mockData: CategorySpending[] = [
  { categoryName: "Food", parentName: "Primary", total: 1500000, count: 20 },
  { categoryName: "Transport", parentName: "Primary", total: 500000, count: 10 },
];

describe("CategoryTable", () => {
  it("shows empty state when data is empty", () => {
    render(<CategoryTable data={[]} currency="Rp" />);
    expect(screen.getByText(/No spending data/i)).toBeInTheDocument();
  });

  it("renders category rows", () => {
    render(<CategoryTable data={mockData} currency="Rp" />);
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
  });

  it("renders a footer totals row", () => {
    render(<CategoryTable data={mockData} currency="Rp" />);
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("does not show transaction counts", () => {
    render(<CategoryTable data={mockData} currency="Rp" />);
    expect(screen.queryByText("20")).not.toBeInTheDocument();
    expect(screen.queryByText("10")).not.toBeInTheDocument();
  });

  it("displays share percentages", () => {
    render(<CategoryTable data={mockData} currency="Rp" />);
    // Food: 1500000/2000000 = 75%
    expect(screen.getByText("75.0%")).toBeInTheDocument();
    // Transport: 500000/2000000 = 25%
    expect(screen.getByText("25.0%")).toBeInTheDocument();
  });
});
