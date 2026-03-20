import { describe, it, expect, beforeAll } from "vitest";
import initSqlJs from "sql.js";
import { getDateRange, getTransactions, getSummary, getCategorySpending, getCategories, getMonthlyTotals, getCategoryMonthlySpending } from "../db";
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
    expect(getDateRange({ type: "all" })).toBeNull();
  });

  it("returns correct year range for 'yearly'", () => {
    const range = getDateRange({ type: "yearly", year: 2025 });
    expect(range).toEqual({ start: "2025-01-01", end: "2025-12-31" });
  });

  it("returns billing period range for 'monthly'", () => {
    const range = getDateRange({ type: "monthly", year: 2025, month: 3 });
    expect(range).not.toBeNull();
    expect(range!.start < range!.end).toBe(true);
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
      const txs = getTransactions(db, { type: "all" });
      // 2 incomes + 4 expenses = 6 (transfer with do_type=3 excluded)
      expect(txs.length).toBe(6);
      expect(txs.every((t) => t.type === 0 || t.type === 1)).toBe(true);
    });

    it("filters by yearly (2026 — no test data, returns empty)", () => {
      const txs = getTransactions(db, { type: "yearly", year: 2026 });
      expect(txs).toEqual([]);
    });

    it("attaches category name to each transaction", () => {
      const txs = getTransactions(db, { type: "all" });
      const foodTx = txs.find((t) => t.note === "Dinner");
      expect(foodTx?.categoryName).toBe("Food");
    });
  });

  describe("getSummary", () => {
    it("computes correct totals for all time", () => {
      const summary = getSummary(db, { type: "all" });
      expect(summary.totalIncome).toBe(5000000 + 6000000);
      expect(summary.totalExpense).toBe(50000 + 30000 + 75000 + 20000);
      expect(summary.balance).toBe(summary.totalIncome - summary.totalExpense);
    });

    it("uses currency symbol", () => {
      const summary = getSummary(db, { type: "all" });
      expect(summary.currency).toBe("Rp");
    });
  });

  describe("getCategorySpending", () => {
    it("returns spending grouped by category (expenses only)", () => {
      const spending = getCategorySpending(db, { type: "all" });
      expect(spending.length).toBe(2);
      const food = spending.find((s) => s.categoryName === "Food");
      expect(food?.total).toBe(50000 + 75000);
      expect(food?.count).toBe(2);
      expect(food?.parentName).toBe("Primary");
    });

    it("attaches parent category name", () => {
      const spending = getCategorySpending(db, { type: "all" });
      expect(spending.every((s) => s.parentName === "Primary")).toBe(true);
    });

    it("is sorted by parent then total descending", () => {
      const spending = getCategorySpending(db, { type: "all" });
      // Both categories share the same parent (Primary), so within the group
      // Food (125000) should come before Transport (50000)
      expect(spending[0].categoryName).toBe("Food");
      expect(spending[1].categoryName).toBe("Transport");
    });

    it("filters to yearly (2026 — no test data, returns empty)", () => {
      const spending = getCategorySpending(db, { type: "yearly", year: 2026 });
      expect(spending).toEqual([]);
    });
  });

  describe("getCategoryMonthlySpending", () => {
    it("returns only expense rows grouped by billing period and category", () => {
      const rows = getCategoryMonthlySpending(db, { type: "all" });
      const periods = [...new Set(rows.map((r) => r.period))].sort();
      expect(periods).toEqual(["2024-06", "2024-07", "2025-03"]);
    });

    it("groups amounts correctly per period and category", () => {
      const rows = getCategoryMonthlySpending(db, { type: "all" });
      const food2024Jun = rows.find((r) => r.period === "2024-06" && r.categoryName === "Food");
      expect(food2024Jun?.amount).toBe(50000);
      const food2025Mar = rows.find((r) => r.period === "2025-03" && r.categoryName === "Food");
      expect(food2025Mar?.amount).toBe(75000);
    });

    it("attaches parent category name", () => {
      const rows = getCategoryMonthlySpending(db, { type: "all" });
      expect(rows.every((r) => r.parentName === "Primary")).toBe(true);
    });

    it("attaches human-readable label", () => {
      const rows = getCategoryMonthlySpending(db, { type: "all" });
      const jun = rows.find((r) => r.period === "2024-06");
      expect(jun?.label).toBe("Jun 2024");
    });

    it("filters to yearly (current year 2026 — no test data)", () => {
      const rows = getCategoryMonthlySpending(db, { type: "yearly", year: 2026 });
      expect(rows).toEqual([]);
    });

    it("filters to monthly (current billing period 2026-03 — no test data)", () => {
      const rows = getCategoryMonthlySpending(db, { type: "monthly", year: 2026, month: 3 });
      expect(rows).toEqual([]);
    });

    it("excludes transfer rows (do_type=3)", () => {
      const rows = getCategoryMonthlySpending(db, { type: "all" });
      // Transfer on 2025-03-25 should not be included — Food in 2025-03 is 75000 only
      const food2025Mar = rows.find((r) => r.period === "2025-03" && r.categoryName === "Food");
      expect(food2025Mar?.amount).toBe(75000);
    });
  });

  describe("getMonthlyTotals (billing periods start on adjusted 25th)", () => {
    it("returns one row per billing period ordered ASC", () => {
      const rows = getMonthlyTotals(db, { type: "all" });
      // All test dates are before the 25th of their month so billing periods
      // align with calendar months: 2024-06, 2024-07, 2025-01, 2025-03
      expect(rows.length).toBe(4);
      expect(rows.map((r) => r.month)).toEqual(["2024-06", "2024-07", "2025-01", "2025-03"]);
    });

    it("correctly pivots income and expense per billing period", () => {
      const rows = getMonthlyTotals(db, { type: "all" });
      const jun24 = rows.find((r) => r.month === "2024-06")!;
      expect(jun24.income).toBe(5000000);
      expect(jun24.expense).toBe(50000);
      expect(jun24.balance).toBe(4950000);

      const mar25 = rows.find((r) => r.month === "2025-03")!;
      expect(mar25.income).toBe(0);
      expect(mar25.expense).toBe(75000 + 20000);
      expect(mar25.balance).toBe(-(75000 + 20000));
    });

    it("excludes transfer rows (do_type=3)", () => {
      const rows = getMonthlyTotals(db, { type: "all" });
      const mar25 = rows.find((r) => r.month === "2025-03")!;
      expect(mar25.expense).toBe(95000);
    });

    it("attaches a human-readable label", () => {
      const rows = getMonthlyTotals(db, { type: "all" });
      const jun24 = rows.find((r) => r.month === "2024-06")!;
      expect(jun24.label).toBe("Jun 2024");
    });

    it("filters to yearly (2026 — no test data, returns empty)", () => {
      const rows = getMonthlyTotals(db, { type: "yearly", year: 2026 });
      expect(rows).toEqual([]);
    });

    it("filters to monthly (current billing period 2026-03 — no test data, returns empty)", () => {
      const rows = getMonthlyTotals(db, { type: "monthly", year: 2026, month: 3 });
      expect(rows).toEqual([]);
    });

    it("assigns a date on or after the adjusted 25th to the next billing period", async () => {
      // Jan 25, 2025 is a Saturday → adjusted start = Jan 24 (Friday)
      // Transactions on Jan 24 and Jan 25 should land in Feb 2025
      // Transactions on Jan 23 should land in Jan 2025
      const SQL = await initSqlJs();
      const boundaryDb = new SQL.Database();
      boundaryDb.run(`
        CREATE TABLE INOUTCOME (wdate TEXT, do_type INTEGER, AMOUNT_ACCOUNT NUMERIC, currencyUid TEXT, ctgUid TEXT, ZCONTENT TEXT);
        INSERT INTO INOUTCOME VALUES ('2025-01-23', 1, 1000, 'IDR_IDR', '1', 'before start');
        INSERT INTO INOUTCOME VALUES ('2025-01-24', 1, 2000, 'IDR_IDR', '1', 'on adjusted start');
        INSERT INTO INOUTCOME VALUES ('2025-01-25', 1, 3000, 'IDR_IDR', '1', 'after adjusted start');
      `);
      const rows = getMonthlyTotals(boundaryDb, "all");
      const jan = rows.find((r) => r.month === "2025-01");
      const feb = rows.find((r) => r.month === "2025-02");
      expect(jan?.expense).toBe(1000);   // only the Jan 23 transaction
      expect(feb?.expense).toBe(5000);   // Jan 24 + Jan 25 roll into Feb billing period
    });
  });
});
