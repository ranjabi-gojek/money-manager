"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDb } from "@/context/DbContext";
import { getMonthlyTotals, getSummary, getCategoryMonthlySpending, getAvailableYears } from "@/lib/db";
import type { MonthlyTotal, CategoryPeriodSpending, TimeFilter } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import FilterTabs from "@/components/FilterTabs";
import MonthlyChart from "@/components/MonthlyChart";
import CategoryTrendChart from "@/components/CategoryTrendChart";

export default function AnalyticsPage() {
  const { db, fileName, restoring } = useDb();
  const router = useRouter();
  const [filter, setFilter] = useState<TimeFilter>({ type: "all" });
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategoryPeriodSpending[]>([]);
  const [currency, setCurrency] = useState("");

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
    setMonthlyTotals(getMonthlyTotals(db, filter));
    setCategorySpending(getCategoryMonthlySpending(db, filter));
    setCurrency(getSummary(db, filter).currency);
  }, [db, filter]);

  if (restoring || !db) {
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-gray-900">Monthly Trends</h1>
          <FilterTabs value={filter} onChange={setFilter} availableYears={availableYears} />
        </div>
        <MonthlyChart data={monthlyTotals} currency={currency} />
        <CategoryTrendChart data={categorySpending} currency={currency} />
      </main>
    </div>
  );
}
