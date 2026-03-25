"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDb } from "@/context/DbContext";
import { getTransactions, getSummary, getCategorySpending, getAvailableYears } from "@/lib/db";
import type { TimeFilter, Transaction, Summary, CategorySpending } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import FilterTabs from "@/components/FilterTabs";
import SummaryCards from "@/components/SummaryCards";
import SpendingChart from "@/components/SpendingChart";
import CategoryTable from "@/components/CategoryTable";
import TransactionList from "@/components/TransactionList";

function filterFromParams(p: ReturnType<typeof useSearchParams>): TimeFilter {
  const tf = p.get("tf");
  if (tf === "monthly") {
    const year = Number(p.get("year")); const month = Number(p.get("month"));
    if (year && month >= 1 && month <= 12) return { type: "monthly", year, month };
  }
  if (tf === "yearly") {
    const year = Number(p.get("year"));
    if (year) return { type: "yearly", year };
  }
  return { type: "all" };
}

function DashboardPage() {
  const { db, fileName, restoring } = useDb();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<TimeFilter>(() => filterFromParams(searchParams));
  const [availableYears, setAvailableYears] = useState<number[]>([]);
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
    setAvailableYears(getAvailableYears(db));
  }, [db]);

  useEffect(() => {
    if (!db) return;
    setTransactions(getTransactions(db, filter));
    setSummary(getSummary(db, filter));
    setCategorySpending(getCategorySpending(db, filter));
    setSelectedCategory(null);
  }, [db, filter]);

  const handleFilterChange = (newFilter: TimeFilter) => {
    setFilter(newFilter);
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter.type === "all") {
      params.delete("tf"); params.delete("year"); params.delete("month");
    } else if (newFilter.type === "yearly") {
      params.set("tf", "yearly"); params.set("year", String(newFilter.year)); params.delete("month");
    } else {
      params.set("tf", "monthly"); params.set("year", String(newFilter.year)); params.set("month", String(newFilter.month));
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Scroll to transactions section after data loads when navigated via hash
  useEffect(() => {
    if (!summary) return;
    if (window.location.hash === "#transactions") {
      document.getElementById("transactions")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [summary]);

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
      <Navbar fileName={fileName} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Filter tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-gray-900">Spending Overview</h1>
          <FilterTabs value={filter} onChange={handleFilterChange} availableYears={availableYears} />
        </div>

        {/* Summary cards */}
        <SummaryCards summary={summary} />

        {/* Chart + Table side by side on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <SpendingChart data={categorySpending} currency={summary.currency} selectedCategory={selectedCategory} onCategoryClick={handleCategoryClick} />
          <CategoryTable data={categorySpending} currency={summary.currency} selectedCategory={selectedCategory} onCategoryClick={handleCategoryClick} />
        </div>

        {/* Transaction list */}
        <div id="transactions">
          <TransactionList transactions={transactions} currency={summary.currency} selectedCategory={selectedCategory} onClearSelectedCategory={() => setSelectedCategory(null)} />
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return <Suspense><DashboardPage /></Suspense>;
}
