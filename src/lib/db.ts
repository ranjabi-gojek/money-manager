import type { Database } from "sql.js";
import type {
  Transaction,
  Category,
  Currency,
  Summary,
  CategorySpending,
  CategoryPeriodSpending,
  MonthlyTotal,
  TimeFilter,
  DateRange,
} from "./types";

export function getDateRange(filter: TimeFilter): DateRange | null {
  const now = new Date();
  const year = now.getFullYear();

  if (filter === "all") return null;
  if (filter === "this_year") {
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  if (filter === "last_year") {
    return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31` };
  }
  return null;
}

function buildWhereClause(
  range: DateRange | null,
  extraConditions: string[] = []
): { where: string; params: Record<string, string> } {
  const conditions = [...extraConditions];
  const params: Record<string, string> = {};

  if (range) {
    conditions.push("i.wdate BETWEEN :start AND :end");
    params[":start"] = range.start;
    params[":end"] = range.end;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

export function getCategories(db: Database): Category[] {
  const result = db.exec(
    "SELECT uid, NAME FROM ZCATEGORY WHERE status=0 AND type=1 AND c_is_del IS NULL ORDER BY NAME"
  );
  if (!result.length) return [];
  return result[0].values.map((row) => ({
    id: row[0] as string | number,
    name: row[1] as string,
  }));
}

export function getCurrencies(db: Database): Record<string, Currency> {
  const result = db.exec("SELECT uid, SYMBOL FROM CURRENCY");
  if (!result.length) return {};
  const map: Record<string, Currency> = {};
  for (const row of result[0].values) {
    const id = row[0] as string;
    map[id] = { id, symbol: row[1] as string };
  }
  return map;
}

export function getTransactions(
  db: Database,
  filter: TimeFilter = "all"
): Transaction[] {
  const range = getDateRange(filter);
  const currencies = getCurrencies(db);

  const { where, params } = buildWhereClause(range, [
    "i.do_type IN (0, 1)",
    "c.uid = i.ctgUid",
  ]);

  const sql = `
    SELECT i.rowid, i.wdate, i.do_type, i.AMOUNT_ACCOUNT, i.currencyUid, i.ctgUid, c.NAME, i.ZCONTENT
    FROM INOUTCOME i, ZCATEGORY c
    ${where}
    ORDER BY i.wdate DESC
  `;

  const result = db.exec(sql, params);
  if (!result.length) return [];

  return result[0].values.map((row) => {
    const currencyId = row[4] as string;
    const currency = currencies[currencyId];
    return {
      id: row[0] as number,
      date: row[1] as string,
      type: Number(row[2]) as 0 | 1,
      amount: Number(row[3]),
      currencyId,
      categoryId: row[5] as string | number,
      categoryName: (row[6] as string) ?? "Uncategorized",
      note: (row[7] as string) ?? "",
      currencySymbol: currency?.symbol ?? currencyId,
    };
  }) as Transaction[];
}

export function getSummary(db: Database, filter: TimeFilter = "all"): Summary {
  const range = getDateRange(filter);
  const currencies = getCurrencies(db);

  const sumQuery = (type: number) => {
    const { where, params } = buildWhereClause(range, [`do_type = ${type}`]);
    const sql = `SELECT SUM(AMOUNT_ACCOUNT), currencyUid FROM INOUTCOME i ${where} GROUP BY currencyUid LIMIT 1`;
    const result = db.exec(sql, params);
    if (!result.length || !result[0].values.length) return { amount: 0, currencyId: "" };
    const row = result[0].values[0];
    return { amount: Number(row[0]) || 0, currencyId: row[1] as string };
  };

  const income = sumQuery(0);
  const expense = sumQuery(1);
  const currencyId = income.currencyId || expense.currencyId;
  const currency = currencies[currencyId];

  return {
    totalIncome: income.amount,
    totalExpense: expense.amount,
    balance: income.amount - expense.amount,
    currency: currency?.symbol ?? currencyId,
  };
}

export function getCategorySpending(
  db: Database,
  filter: TimeFilter = "all"
): CategorySpending[] {
  const range = getDateRange(filter);
  const conditions: string[] = ["i.do_type = 1"];
  const params: Record<string, string> = {};

  if (range) {
    conditions.push("i.wdate BETWEEN :start AND :end");
    params[":start"] = range.start;
    params[":end"] = range.end;
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const sql = `
    SELECT c.NAME, p.NAME as parentName, SUM(i.AMOUNT_ACCOUNT) as total, COUNT(*) as cnt
    FROM INOUTCOME i
    JOIN ZCATEGORY c ON c.uid = i.ctgUid
    LEFT JOIN ZCATEGORY p ON p.uid = c.pUid
    ${where}
    GROUP BY c.uid
    ORDER BY CASE WHEN p.NAME IS NULL THEN 1 ELSE 0 END, p.NAME, total DESC
  `;

  const result = db.exec(sql, params);
  if (!result.length) return [];

  return result[0].values.map((row) => ({
    categoryName: (row[0] as string) ?? "Uncategorized",
    parentName: (row[1] as string) ?? null,
    total: (row[2] as number) ?? 0,
    count: (row[3] as number) ?? 0,
  }));
}

// Returns the effective start date of the billing period for a given calendar month.
// The period starts on the 25th; if that falls on Saturday → Friday (24th),
// if Sunday → Friday (23rd).
function billingPeriodStart(year: number, month: number): Date {
  // month is 1-indexed
  const d = new Date(year, month - 1, 25);
  const dow = d.getDay(); // 0=Sun, 6=Sat
  if (dow === 0) d.setDate(23);
  else if (dow === 6) d.setDate(24);
  return d;
}

// Returns the "YYYY-MM" billing period key for a transaction date string.
// The billing period for month M starts around the 25th of month M-1 and
// ends around the 24th of month M.
function billingPeriodForDate(wdate: string): string {
  const [y, m, day] = wdate.split("-").map(Number);
  const txDate = new Date(y, m - 1, day);
  const periodStart = billingPeriodStart(y, m);
  if (txDate >= periodStart) {
    // On or after this month's 25th → belongs to next month's billing period
    const nextY = m === 12 ? y + 1 : y;
    const nextM = m === 12 ? 1 : m + 1;
    return `${nextY}-${String(nextM).padStart(2, "0")}`;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function getCategoryMonthlySpending(
  db: Database,
  filter: TimeFilter = "all"
): CategoryPeriodSpending[] {
  let sqlWhere = "WHERE i.do_type = 1";
  const params: Record<string, string> = {};
  let targetYear: number | null = null;

  if (filter !== "all") {
    const now = new Date();
    const year = now.getFullYear();
    targetYear = filter === "this_year" ? year : year - 1;
    params[":start"] = `${targetYear - 1}-12-20`;
    params[":end"] = `${targetYear}-12-31`;
    sqlWhere += " AND i.wdate BETWEEN :start AND :end";
  }

  const sql = `
    SELECT i.wdate, c.NAME, p.NAME as parentName, i.AMOUNT_ACCOUNT
    FROM INOUTCOME i
    JOIN ZCATEGORY c ON c.uid = i.ctgUid
    LEFT JOIN ZCATEGORY p ON p.uid = c.pUid
    ${sqlWhere}
    ORDER BY i.wdate ASC
  `;

  const result = db.exec(sql, params);
  if (!result.length) return [];

  // Group by billing period + category
  const groups = new Map<string, { parentName: string | null; amount: number }>();
  const periodLabels = new Map<string, string>();

  for (const row of result[0].values) {
    const wdate = row[0] as string;
    const categoryName = row[1] as string;
    const parentName = (row[2] as string) ?? null;
    const amount = Number(row[3]) || 0;
    const period = billingPeriodForDate(wdate);

    if (targetYear !== null && !period.startsWith(`${targetYear}-`)) continue;

    const key = `${period}::${categoryName}`;
    if (!groups.has(key)) {
      groups.set(key, { parentName, amount: 0 });
      if (!periodLabels.has(period)) {
        const [y, mo] = period.split("-").map(Number);
        periodLabels.set(period, new Date(y, mo - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" }));
      }
    }
    groups.get(key)!.amount += amount;
  }

  return [...groups.entries()].map(([key, { parentName, amount }]) => {
    const [period, categoryName] = key.split("::");
    return { period, label: periodLabels.get(period)!, parentName, categoryName, amount };
  });
}

export function getMonthlyTotals(
  db: Database,
  filter: TimeFilter = "all"
): MonthlyTotal[] {
  // Expand the SQL date range to account for billing periods crossing calendar month
  // boundaries (the period for January starts ~Dec 25 of the prior year).
  let sqlWhere = "WHERE i.do_type IN (0, 1)";
  const params: Record<string, string> = {};
  let targetYear: number | null = null;

  if (filter !== "all") {
    const now = new Date();
    const year = now.getFullYear();
    targetYear = filter === "this_year" ? year : year - 1;
    // Fetch from late-Dec of prior year so the January billing period is captured
    params[":start"] = `${targetYear - 1}-12-20`;
    params[":end"] = `${targetYear}-12-31`;
    sqlWhere += " AND i.wdate BETWEEN :start AND :end";
  }

  const sql = `
    SELECT i.wdate, i.do_type, i.AMOUNT_ACCOUNT
    FROM INOUTCOME i
    ${sqlWhere}
    ORDER BY i.wdate ASC
  `;

  const result = db.exec(sql, params);
  if (!result.length) return [];

  // Group by billing period in JS
  const groups = new Map<string, { income: number; expense: number }>();
  for (const row of result[0].values) {
    const wdate = row[0] as string;
    const doType = Number(row[1]);
    const amount = Number(row[2]) || 0;
    const period = billingPeriodForDate(wdate);

    // When filtering by year, skip periods that fall outside the target year
    if (targetYear !== null && !period.startsWith(`${targetYear}-`)) continue;

    if (!groups.has(period)) groups.set(period, { income: 0, expense: 0 });
    const g = groups.get(period)!;
    if (doType === 0) g.income += amount;
    else if (doType === 1) g.expense += amount;
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expense }]) => {
      const [y, mo] = month.split("-").map(Number);
      const label = new Date(y, mo - 1, 1).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      return { month, label, income, expense, balance: income - expense };
    });
}
