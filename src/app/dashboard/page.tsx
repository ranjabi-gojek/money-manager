"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDb } from "@/context/DbContext";
import { getTransactions, getSummary, getCategorySpending } from "@/lib/db";
import type { TimeFilter, Transaction, Summary, CategorySpending } from "@/lib/types";
import { Loader2 } from "lucide-react";
import FilterTabs from "@/components/FilterTabs";
import SummaryCards from "@/components/SummaryCards";
import SpendingChart from "@/components/SpendingChart";
import CategoryTable from "@/components/CategoryTable";
import TransactionList from "@/components/TransactionList";
import { FileArchive } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { db, fileName, restoring } = useDb();
  const router = useRouter();
  const [filter, setFilter] = useState<TimeFilter>("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Wait for IndexedDB restore before deciding whether to redirect
  useEffect(() => {
    if (restoring) return;
    if (!db) router.replace("/");
  }, [restoring, db, router]);

  useEffect(() => {
    if (!db) return;
    setTransactions(getTransactions(db, filter));
    setSummary(getSummary(db, filter));
    setCategorySpending(getCategorySpending(db, filter));
    setSelectedCategory(null);
  }, [db, filter]);

  const handleCategoryClick = (category: string) =>
    setSelectedCategory((prev) => (prev === category ? null : category));

  if (restoring || !db || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <SpendingChart data={categorySpending} currency={summary.currency} selectedCategory={selectedCategory} onCategoryClick={handleCategoryClick} />
          <CategoryTable data={categorySpending} currency={summary.currency} selectedCategory={selectedCategory} onCategoryClick={handleCategoryClick} />
        </div>

        {/* Transaction list */}
        <TransactionList transactions={transactions} currency={summary.currency} selectedCategory={selectedCategory} onClearSelectedCategory={() => setSelectedCategory(null)} />
      </main>
    </div>
  );
}
