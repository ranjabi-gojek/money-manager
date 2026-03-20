import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TransactionList from "../TransactionList";
import type { Transaction } from "@/lib/types";

function makeTx(overrides: Partial<Transaction> & { id: number }): Transaction {
  return {
    date: "2025-03-01",
    type: 1,
    amount: 50000,
    currencyId: "IDR_IDR",
    categoryId: 1,
    categoryName: "Food",
    note: "lunch",
    ...overrides,
  };
}

const transactions: Transaction[] = [
  makeTx({ id: 1, categoryName: "Food", note: "lunch", amount: 50000, type: 1 }),
  makeTx({ id: 2, categoryName: "Transport", note: "grab", amount: 25000, type: 1 }),
  makeTx({ id: 3, categoryName: "Salary", note: "monthly salary", amount: 5000000, type: 0 }),
];

describe("TransactionList", () => {
  it("renders all transactions", () => {
    render(<TransactionList transactions={transactions} currency="Rp" />);
    expect(screen.getByText("lunch")).toBeInTheDocument();
    expect(screen.getByText("grab")).toBeInTheDocument();
    expect(screen.getByText("monthly salary")).toBeInTheDocument();
  });

  it("shows transaction count", () => {
    render(<TransactionList transactions={transactions} currency="Rp" />);
    expect(screen.getByText("(3)")).toBeInTheDocument();
  });

  it("filters by note search", () => {
    render(<TransactionList transactions={transactions} currency="Rp" />);
    const input = screen.getByPlaceholderText(/Search note or category/i);
    fireEvent.change(input, { target: { value: "grab" } });
    expect(screen.getByText("grab")).toBeInTheDocument();
    expect(screen.queryByText("lunch")).not.toBeInTheDocument();
    expect(screen.getByText("(1)")).toBeInTheDocument();
  });

  it("filters by category search", () => {
    render(<TransactionList transactions={transactions} currency="Rp" />);
    const input = screen.getByPlaceholderText(/Search note or category/i);
    fireEvent.change(input, { target: { value: "transport" } });
    expect(screen.getByText("grab")).toBeInTheDocument();
    expect(screen.queryByText("lunch")).not.toBeInTheDocument();
  });

  it("shows income amounts in green with + prefix", () => {
    render(<TransactionList transactions={transactions} currency="Rp" />);
    const incomeCell = screen.getByText("+Rp5.000.000");
    expect(incomeCell).toHaveClass("text-green-600");
  });

  it("shows expense amounts in red with - prefix", () => {
    render(<TransactionList transactions={transactions} currency="Rp" />);
    const expenseCell = screen.getByText("-Rp50.000");
    expect(expenseCell).toHaveClass("text-red-500");
  });

  it("shows empty state when search has no results", () => {
    render(<TransactionList transactions={transactions} currency="Rp" />);
    const input = screen.getByPlaceholderText(/Search note or category/i);
    fireEvent.change(input, { target: { value: "zzznomatch" } });
    expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
  });

  it("shows empty state when no transactions are passed", () => {
    render(<TransactionList transactions={[]} currency="Rp" />);
    expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
  });

  describe("amount sorting", () => {
    // transactions: lunch -50k, grab -25k, salary +5M
    // signed values:  -50000,   -25000,    +5000000
    // desc (biggest first): salary(+5M), grab(-25k), lunch(-50k)
    // asc (smallest first): lunch(-50k), grab(-25k), salary(+5M)

    it("sorts descending on first click: income first, then least-negative expense last", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      fireEvent.click(screen.getByRole("button", { name: /amount/i }));
      const rows = screen.getAllByRole("row").slice(1);
      expect(rows[0].textContent).toContain("monthly salary"); // +5M, largest signed
      expect(rows[1].textContent).toContain("grab");           // -25k > -50k
      expect(rows[2].textContent).toContain("lunch");          // -50k, smallest signed
    });

    it("sorts ascending on second click: biggest expense first, income last", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      const btn = screen.getByRole("button", { name: /amount/i });
      fireEvent.click(btn); // desc
      fireEvent.click(btn); // asc
      const rows = screen.getAllByRole("row").slice(1);
      expect(rows[0].textContent).toContain("lunch");          // -50k, smallest signed
      expect(rows[1].textContent).toContain("grab");           // -25k
      expect(rows[2].textContent).toContain("monthly salary"); // +5M, largest signed
    });

    it("restores original order on third click", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      const btn = screen.getByRole("button", { name: /amount/i });
      fireEvent.click(btn); // desc
      fireEvent.click(btn); // asc
      fireEvent.click(btn); // reset
      const rows = screen.getAllByRole("row").slice(1);
      // Original order: lunch (50k), grab (25k), salary (5M)
      expect(rows[0].textContent).toContain("lunch");
      expect(rows[1].textContent).toContain("grab");
      expect(rows[2].textContent).toContain("monthly salary");
    });
  });
});
