export type TransactionType = 0 | 1 | 3 | 4 | 7;
// 0 = income, 1 = expense, 3 = transfer, 4 = other, 7 = adjustment

export interface Transaction {
  id: number;
  date: string; // "YYYY-MM-DD"
  type: TransactionType;
  amount: number;
  currencyId: string;
  categoryId: string | number;
  categoryName: string;
  note: string;
}

export interface Category {
  id: string | number;
  name: string;
}

export interface Currency {
  id: string;
  symbol: string;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  currency: string;
}

export interface CategorySpending {
  categoryName: string;
  parentName: string | null;
  total: number;
  count: number;
}

export type TimeFilter = "all" | "this_year" | "last_year";

export type CategoryFilterMode = "include" | "exclude";

export interface CategoryFilter {
  mode: CategoryFilterMode;
  /** Category names selected for the filter. Empty set = no active filter. */
  selected: Set<string>;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface MonthlyTotal {
  month: string;   // "YYYY-MM"
  label: string;   // "Jan 2024"
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryPeriodSpending {
  period: string;       // "YYYY-MM"
  label: string;        // "Jan 2025"
  parentName: string | null;
  categoryName: string;
  amount: number;
}
