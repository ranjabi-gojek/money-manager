"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import type { Summary } from "@/lib/types";

function formatAmount(amount: number, symbol: string) {
  return `${symbol}${Math.abs(amount).toLocaleString("id-ID")}`;
}

interface CardProps {
  label: string;
  amount: number;
  symbol: string;
  icon: React.ReactNode;
  colorClass: string;
}

function Card({ label, amount, symbol, icon, colorClass }: CardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900 mt-0.5">
          {formatAmount(amount, symbol)}
        </p>
      </div>
    </div>
  );
}

interface SummaryCardsProps {
  summary: Summary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const { totalIncome, totalExpense, balance, currency } = summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        label="Total Income"
        amount={totalIncome}
        symbol={currency}
        icon={<TrendingUp className="w-5 h-5 text-green-600" />}
        colorClass="bg-green-50"
      />
      <Card
        label="Total Expense"
        amount={totalExpense}
        symbol={currency}
        icon={<TrendingDown className="w-5 h-5 text-red-500" />}
        colorClass="bg-red-50"
      />
      <Card
        label="Balance"
        amount={balance}
        symbol={currency}
        icon={<Wallet className="w-5 h-5 text-blue-600" />}
        colorClass="bg-blue-50"
      />
    </div>
  );
}

export { formatAmount };
