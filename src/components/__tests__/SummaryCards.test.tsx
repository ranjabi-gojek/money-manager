import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SummaryCards, { formatAmount } from "../SummaryCards";
import type { Summary } from "@/lib/types";

const mockSummary: Summary = {
  totalIncome: 6000000,
  totalExpense: 175000,
  balance: 5825000,
  currency: "Rp",
};

describe("formatAmount", () => {
  it("formats with currency symbol", () => {
    expect(formatAmount(50000, "Rp")).toBe("Rp50.000");
  });

  it("formats negative balance as absolute value", () => {
    expect(formatAmount(-1000, "Rp")).toBe("Rp1.000");
  });
});

describe("SummaryCards", () => {
  it("renders all three cards", () => {
    render(<SummaryCards summary={mockSummary} />);
    expect(screen.getByText("Total Income")).toBeInTheDocument();
    expect(screen.getByText("Total Expense")).toBeInTheDocument();
    expect(screen.getByText("Balance")).toBeInTheDocument();
  });

  it("displays formatted amounts with currency symbol", () => {
    render(<SummaryCards summary={mockSummary} />);
    expect(screen.getByText("Rp6.000.000")).toBeInTheDocument();
    expect(screen.getByText("Rp175.000")).toBeInTheDocument();
    expect(screen.getByText("Rp5.825.000")).toBeInTheDocument();
  });
});
