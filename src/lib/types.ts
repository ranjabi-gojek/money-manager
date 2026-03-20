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
  total: number;
  count: number;
}

export type TimeFilter = "all" | "this_year" | "last_year";

export interface DateRange {
  start: string;
  end: string;
}
