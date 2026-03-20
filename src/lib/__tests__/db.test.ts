import { describe, it, expect, beforeAll } from "vitest";
import initSqlJs from "sql.js";
import { getDateRange, getTransactions, getSummary, getCategorySpending, getCategories, getMonthlyTotals } from "../db";
import type { Database } from "sql.js";

// Build an in-memory SQLite DB that mimics the .mmbak schema
async function buildMockDb(): Promise<Database> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE CURRENCY (uid TEXT PRIMARY KEY, SYMBOL TEXT);
    INSERT INTO CURRENCY VALUES ('IDR_IDR', 'Rp');

    CREATE TABLE ZCATEGORY (uid TEXT PRIMARY KEY, NAME TEXT, status INTEGER, type INTEGER, c_is_del INTEGER, pUid TEXT);
    INSERT INTO ZCATEGORY VALUES ('p1', 'Primary', 0, 1, 1, NULL);
    INSERT INTO ZCATEGORY VALUES ('1', 'Food', 0, 1, NULL, 'p1');
    INSERT INTO ZCATEGORY VALUES ('2', 'Transport', 0, 1, NULL, 'p1');
    INSERT INTO ZCATEGORY VALUES ('3', 'Salary', 0, 0, NULL, NULL);

    CREATE TABLE INOUTCOME (
      wdate TEXT, do_type INTEGER, AMOUNT_ACCOUNT NUMERIC,
      currencyUid TEXT, ctgUid INTEGER, ZCONTENT TEXT
    );
    -- Income: 2024
    INSERT INTO INOUTCOME VALUES ('2024-06-01', 0, 5000000, 'IDR_IDR', '3', 'Salary June');
    -- Expenses: 2024
    INSERT INTO INOUTCOME VALUES ('2024-06-15', 1, 50000, 'IDR_IDR', '1', 'Lunch');
    INSERT INTO INOUTCOME VALUES ('2024-07-01', 1, 30000, 'IDR_IDR', '2', 'Grab');
    -- Income: 2025
    INSERT INTO INOUTCOME VALUES ('2025-01-10', 0, 6000000, 'IDR_IDR', '3', 'Salary Jan 2025');
    -- Expenses: 2025
    INSERT INTO INOUTCOME VALUES ('2025-03-05', 1, 75000, 'IDR_IDR', '1', 'Dinner');
    INSERT INTO INOUTCOME VALUES ('2025-03-20', 1, 20000, 'IDR_IDR', '2', 'Bus');
    -- Transfer (should be excluded)
    INSERT INTO INOUTCOME VALUES ('2025-03-25', 3, 100000, 'IDR_IDR', '1', 'Transfer');
  `);

  return db;
}

describe("getDateRange", () => {
  it("returns null for 'all'", () => {
    expect(getDateRange("all")).toBeNull();
  });

  it("returns current year range for 'this_year'", () => {
    const range = getDateRange("this_year");
    const year = new Date().getFullYear();
    expect(range).toEqual({ start: `${year}-01-01`, end: `${year}-12-31` });
  });

  it("returns last year range for 'last_year'", () => {
    const range = getDateRange("last_year");
    const year = new Date().getFullYear() - 1;
    expect(range).toEqual({ start: `${year}-01-01`, end: `${year}-12-31` });
  });
});

describe("db queries", () => {
  let db: Database;

  beforeAll(async () => {
    db = await buildMockDb();
  });

  describe("getCategories", () => {
    it("returns only expense categories (type=1)", () => {
      const cats = getCategories(db);
      expect(cats.length).toBe(2);
      expect(cats.map((c) => c.name)).toContain("Food");
      expect(cats.map((c) => c.name)).toContain("Transport");
    });
  });

  describe("getTransactions", () => {
    it("returns all income and expense rows (excludes transfers)", () => {
      const txs = getTransactions(db, "all");
      // 2 incomes + 4 expenses = 6 (transfer with do_type=3 excluded)
      expect(txs.length).toBe(6);
      expect(txs.every((t) => t.type === 0 || t.type === 1)).toBe(true);
    });

    it("filters by last_year (2024)", () => {
      // Assumes current year >= 2026; last year = 2025 has 3 transactions
      const txs = getTransactions(db, "last_year");
      expect(txs.every((t) => t.date.startsWith("2025"))).toBe(true);
    });

    it("attaches category name to each transaction", () => {
      const txs = getTransactions(db, "all");
      const foodTx = txs.find((t) => t.note === "Dinner");
      expect(foodTx?.categoryName).toBe("Food");
    });
  });

  describe("getSummary", () => {
    it("computes correct totals for all time", () => {
      const summary = getSummary(db, "all");
      expect(summary.totalIncome).toBe(5000000 + 6000000);
      expect(summary.totalExpense).toBe(50000 + 30000 + 75000 + 20000);
      expect(summary.balance).toBe(summary.totalIncome - summary.totalExpense);
    });

    it("uses currency symbol", () => {
      const summary = getSummary(db, "all");
      expect(summary.currency).toBe("Rp");
    });
  });

  describe("getCategorySpending", () => {
    it("returns spending grouped by category (expenses only)", () => {
      const spending = getCategorySpending(db, "all");
      expect(spending.length).toBe(2);
      const food = spending.find((s) => s.categoryName === "Food");
      expect(food?.total).toBe(50000 + 75000);
      expect(food?.count).toBe(2);
      expect(food?.parentName).toBe("Primary");
    });

    it("attaches parent category name", () => {
      const spending = getCategorySpending(db, "all");
      expect(spending.every((s) => s.parentName === "Primary")).toBe(true);
    });

    it("is sorted by parent then total descending", () => {
      const spending = getCategorySpending(db, "all");
      // Both categories share the same parent (Primary), so within the group
      // Food (125000) should come before Transport (50000)
      expect(spending[0].categoryName).toBe("Food");
      expect(spending[1].categoryName).toBe("Transport");
    });

    it("filters to last_year only", () => {
      const spending = getCategorySpending(db, "last_year");
      // 2025: Food 75000, Transport 20000
      const food = spending.find((s) => s.categoryName === "Food");
      expect(food?.total).toBe(75000);
    });
  });

  describe("getMonthlyTotals", () => {
    it("returns one row per month ordered ASC", () => {
      const rows = getMonthlyTotals(db, "all");
      // mock data spans 2024-06, 2024-07, 2025-01, 2025-03
      expect(rows.length).toBe(4);
      expect(rows.map((r) => r.month)).toEqual(["2024-06", "2024-07", "2025-01", "2025-03"]);
    });

    it("correctly pivots income and expense per month", () => {
      const rows = getMonthlyTotals(db, "all");
      const jun24 = rows.find((r) => r.month === "2024-06")!;
      expect(jun24.income).toBe(5000000);
      expect(jun24.expense).toBe(50000);
      expect(jun24.balance).toBe(4950000);

      const mar25 = rows.find((r) => r.month === "2025-03")!;
      expect(mar25.income).toBe(0);
      expect(mar25.expense).toBe(75000 + 20000); // Dinner + Bus (transfer excluded)
      expect(mar25.balance).toBe(-(75000 + 20000));
    });

    it("excludes transfer rows (do_type=3)", () => {
      const rows = getMonthlyTotals(db, "all");
      const mar25 = rows.find((r) => r.month === "2025-03")!;
      // transfer of 100000 must not appear in expense
      expect(mar25.expense).toBe(95000);
    });

    it("attaches a human-readable label", () => {
      const rows = getMonthlyTotals(db, "all");
      const jun24 = rows.find((r) => r.month === "2024-06")!;
      expect(jun24.label).toBe("Jun 2024");
    });

    it("filters to last_year (2025)", () => {
      const rows = getMonthlyTotals(db, "last_year");
      expect(rows.every((r) => r.month.startsWith("2025-"))).toBe(true);
      expect(rows.length).toBe(2); // Jan + Mar
    });

    it("returns empty array when no data matches filter", () => {
      // this_year = 2026, no 2026 data in mock
      const rows = getMonthlyTotals(db, "this_year");
      expect(rows).toEqual([]);
    });
  });
});
