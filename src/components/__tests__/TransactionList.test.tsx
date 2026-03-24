import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TransactionList from "../TransactionList";
import type { Transaction } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/dashboard",
}));


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

  describe("reset filters", () => {
    it("reset button is hidden when no filters are active", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      expect(screen.queryByRole("button", { name: /reset filters/i })).not.toBeInTheDocument();
    });

    it("reset button appears when page size differs from default", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      fireEvent.change(screen.getByLabelText(/Rows per page/i), { target: { value: "20" } });
      expect(screen.getByRole("button", { name: /reset filters/i })).toBeInTheDocument();
    });

    it("reset button appears when search is active", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      fireEvent.change(screen.getByPlaceholderText(/Search note or category/i), { target: { value: "grab" } });
      expect(screen.getByRole("button", { name: /reset filters/i })).toBeInTheDocument();
    });

    it("reset button appears when sort is active", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      fireEvent.click(screen.getByRole("button", { name: /amount/i }));
      expect(screen.getByRole("button", { name: /reset filters/i })).toBeInTheDocument();
    });

    it("reset button appears when category filter is active", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      fireEvent.click(screen.getByText("Filter categories"));
      fireEvent.click(screen.getByLabelText("Food"));
      expect(screen.getByRole("button", { name: /reset filters/i })).toBeInTheDocument();
    });

    it("clicking reset clears search, sort, page size, and category filter", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      // Apply multiple filters
      fireEvent.change(screen.getByPlaceholderText(/Search note or category/i), { target: { value: "grab" } });
      fireEvent.click(screen.getByRole("button", { name: /amount/i }));
      fireEvent.change(screen.getByLabelText(/Rows per page/i), { target: { value: "50" } });
      // Reset
      fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));
      // All 3 transactions visible again
      expect(screen.getByText("(3)")).toBeInTheDocument();
      expect(screen.getByText("lunch")).toBeInTheDocument();
      expect(screen.getByText("grab")).toBeInTheDocument();
      expect(screen.getByText("monthly salary")).toBeInTheDocument();
      // Page size back to 10
      expect((screen.getByLabelText(/Rows per page/i) as HTMLSelectElement).value).toBe("10");
      // Button gone
      expect(screen.queryByRole("button", { name: /reset filters/i })).not.toBeInTheDocument();
    });
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

  describe("rows per page", () => {
    it("defaults to 10 rows per page", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      const select = screen.getByLabelText(/Rows per page/i) as HTMLSelectElement;
      expect(select.value).toBe("10");
    });

    it("shows all size options (10, 20, 50, 100)", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      const options = Array.from(
        (screen.getByLabelText(/Rows per page/i) as HTMLSelectElement).options
      ).map((o) => o.value);
      expect(options).toEqual(["10", "15", "20", "50", "100"]);
    });

    it("changing page size resets to page 1 and re-paginates", () => {
      // Build 25 transactions so pagination kicks in at size 10
      const many = Array.from({ length: 25 }, (_, i) =>
        makeTx({ id: i + 1, note: `tx-${i + 1}` })
      );
      render(<TransactionList transactions={many} currency="Rp" />);

      // Default size 10: page 1 of 3
      expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();

      // Switch to 20 rows → page 1 of 2
      fireEvent.change(screen.getByLabelText(/Rows per page/i), {
        target: { value: "20" },
      });
      expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();

      // Switch to 50 rows → all fit on one page (no pagination shown)
      fireEvent.change(screen.getByLabelText(/Rows per page/i), {
        target: { value: "50" },
      });
      expect(screen.queryByText(/Page \d+ of \d+/i)).not.toBeInTheDocument();
    });
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

  describe("category filter", () => {
    const openPopover = () =>
      fireEvent.click(screen.getByText("Filter categories"));

    it("include mode: shows only selected categories", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      openPopover();
      fireEvent.click(screen.getByLabelText("Food"));
      expect(screen.getByText("lunch")).toBeInTheDocument();
      expect(screen.queryByText("grab")).not.toBeInTheDocument();
      expect(screen.queryByText("monthly salary")).not.toBeInTheDocument();
      expect(screen.getByText("(1)")).toBeInTheDocument();
    });

    it("include mode with multiple categories shows all of them", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      openPopover();
      fireEvent.click(screen.getByLabelText("Food"));
      fireEvent.click(screen.getByLabelText("Transport"));
      expect(screen.getByText("lunch")).toBeInTheDocument();
      expect(screen.getByText("grab")).toBeInTheDocument();
      expect(screen.queryByText("monthly salary")).not.toBeInTheDocument();
      expect(screen.getByText("(2)")).toBeInTheDocument();
    });

    it("exclude mode: hides selected categories", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      openPopover();
      fireEvent.click(screen.getByText("Exclude"));
      fireEvent.click(screen.getByLabelText("Food"));
      expect(screen.queryByText("lunch")).not.toBeInTheDocument();
      expect(screen.getByText("grab")).toBeInTheDocument();
      expect(screen.getByText("monthly salary")).toBeInTheDocument();
      expect(screen.getByText("(2)")).toBeInTheDocument();
    });

    it("clear filter restores all transactions", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      openPopover();
      // Popover is open — select Food; Clear filter appears inside the open popover
      fireEvent.click(screen.getByLabelText("Food"));
      expect(screen.getByText("(1)")).toBeInTheDocument();
      // Clear filter button is visible while popover is still open
      fireEvent.click(screen.getByText("Clear filter"));
      expect(screen.getByText("(3)")).toBeInTheDocument();
    });

    it("category filter composes with text search", () => {
      render(<TransactionList transactions={transactions} currency="Rp" />);
      openPopover();
      fireEvent.click(screen.getByLabelText("Food"));
      // Now only Food is visible; search within it
      const input = screen.getByPlaceholderText(/Search note or category/i);
      fireEvent.change(input, { target: { value: "zzznomatch" } });
      expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
    });
  });

});
