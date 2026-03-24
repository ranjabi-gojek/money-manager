"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDb } from "@/context/DbContext";
import { getMonthlyTotals, getSummary, getCategoryMonthlySpending, getAvailableYears } from "@/lib/db";
import type { MonthlyTotal, CategoryPeriodSpending, TimeFilter } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import FilterTabs from "@/components/FilterTabs";
import MonthlyChart from "@/components/MonthlyChart";
import CategoryTrendChart from "@/components/CategoryTrendChart";

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

function AnalyticsPage() {
  const { db, fileName, restoring } = useDb();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<TimeFilter>(() => filterFromParams(searchParams));
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
          <FilterTabs value={filter} onChange={handleFilterChange} availableYears={availableYears} />
        </div>
        <MonthlyChart data={monthlyTotals} currency={currency} />
        <CategoryTrendChart data={categorySpending} currency={currency} />
      </main>
    </div>
  );
}

export default function Page() {
  return <Suspense><AnalyticsPage /></Suspense>;
}
