import type { Database } from "sql.js";
import type {
  Transaction,
  Category,
  Currency,
  Summary,
  CategorySpending,
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
  const { where, params } = buildWhereClause(range, [
    "i.do_type = 1",
    "c.uid = i.ctgUid",
  ]);

  const sql = `
    SELECT c.NAME, SUM(i.AMOUNT_ACCOUNT) as total, COUNT(*) as cnt
    FROM INOUTCOME i, ZCATEGORY c
    ${where}
    GROUP BY c.uid
    ORDER BY total DESC
  `;

  const result = db.exec(sql, params);
  if (!result.length) return [];

  return result[0].values.map((row) => ({
    categoryName: (row[0] as string) ?? "Uncategorized",
    total: (row[1] as number) ?? 0,
    count: (row[2] as number) ?? 0,
  }));
}
