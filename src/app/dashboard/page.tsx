"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDb } from "@/context/DbContext";
import { getTransactions, getSummary, getCategorySpending } from "@/lib/db";
import type { TimeFilter, Transaction, Summary, CategorySpending } from "@/lib/types";
import FilterTabs from "@/components/FilterTabs";
import SummaryCards from "@/components/SummaryCards";
import SpendingChart from "@/components/SpendingChart";
import CategoryTable from "@/components/CategoryTable";
import TransactionList from "@/components/TransactionList";
import { FileArchive } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { db, fileName } = useDb();
  const router = useRouter();
  const [filter, setFilter] = useState<TimeFilter>("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);

  // Redirect to upload if no DB is loaded (e.g. page refresh)
  useEffect(() => {
    if (!db) {
      router.replace("/");
    }
  }, [db, router]);

  useEffect(() => {
    if (!db) return;
    setTransactions(getTransactions(db, filter));
    setSummary(getSummary(db, filter));
    setCategorySpending(getCategorySpending(db, filter));
  }, [db, filter]);

  if (!db || !summary) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-800">Money Manager</span>
            {fileName && (
              <span className="text-sm text-gray-400 ml-1 hidden sm:inline">
                — {fileName}
              </span>
            )}
          </div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Upload another file
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Filter tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-gray-900">Spending Overview</h1>
          <FilterTabs value={filter} onChange={setFilter} />
        </div>

        {/* Summary cards */}
        <SummaryCards summary={summary} />

        {/* Chart + Table side by side on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingChart data={categorySpending} currency={summary.currency} />
          <CategoryTable data={categorySpending} currency={summary.currency} />
        </div>

        {/* Transaction list */}
        <TransactionList transactions={transactions} currency={summary.currency} />
      </main>
    </div>
  );
}
