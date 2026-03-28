"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDb } from "@/context/DbContext";
import { getTopMonthlyExpenses, getSummary } from "@/lib/db";
import type { TopMonthlyExpense } from "@/lib/types";
import { Loader2, Minus, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTH_ABBR[m - 1]} ${String(y).slice(2)}`;
}

const DEFAULT_N = 5;
const MIN_N = 1;
const MAX_N = 10;

function TopExpensesPage() {
  const { db, fileName, restoring } = useDb();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [topN, setTopN] = useState(() => {
    const n = Number(searchParams.get("n"));
    return n >= MIN_N && n <= MAX_N ? n : DEFAULT_N;
  });
  const [months, setMonths] = useState<TopMonthlyExpense[]>([]);
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    if (restoring) return;
    if (!db) router.replace("/");
  }, [restoring, db, router]);

  useEffect(() => {
    if (!db) return;
    setMonths(getTopMonthlyExpenses(db, topN));
    setCurrency(getSummary(db).currency);
  }, [db, topN]);

  const handleN = (delta: number) => {
    const next = Math.min(MAX_N, Math.max(MIN_N, topN + delta));
    if (next === topN) return;
    setTopN(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_N) params.delete("n");
    else params.set("n", String(next));
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
          <h1 className="text-xl font-bold text-gray-900">Top Monthly Expenses</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Show top</span>
            <button
              onClick={() => handleN(-1)}
              disabled={topN <= MIN_N}
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Decrease"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center font-semibold text-gray-800 tabular-nums">{topN}</span>
            <button
              onClick={() => handleN(1)}
              disabled={topN >= MAX_N}
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Increase"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm text-gray-500">per month</span>
          </div>
        </div>

        {months.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No expense data found.</div>
        ) : (
          <div className="flex flex-col gap-5">
            {months.map(({ month, label, expenses }) => (
              <div key={month} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-sm font-semibold text-gray-700">{label}</h2>
                </div>
                {/* Mobile card list */}
                <ul className="sm:hidden divide-y divide-gray-100">
                  {expenses.map((exp, i) => (
                    <li key={i} className="px-4 py-2.5 flex items-center gap-3">
                      <span className="text-xs text-gray-300 font-mono w-4 shrink-0 text-right">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-700 truncate">{exp.note || "—"}</p>
                        <p className="text-sm text-gray-400 truncate pt-0.5">{exp.categoryName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-red-600 tabular-nums whitespace-nowrap">
                          {currency}{exp.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 tabular-nums pt-0.5">{fmtDate(exp.date)}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm table-fixed min-w-[480px]">
                    <colgroup>
                      <col className="w-8" />
                      <col className="w-28" />
                      <col className="w-36" />
                      <col />
                      <col className="w-36" />
                    </colgroup>
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="px-5 py-2">#</th>
                        <th className="px-5 py-2">Date</th>
                        <th className="px-5 py-2">Category</th>
                        <th className="px-5 py-2">Note</th>
                        <th className="px-5 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((exp, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-2.5 text-gray-300 font-mono text-xs">{i + 1}</td>
                          <td className="px-5 py-2.5 text-gray-500 whitespace-nowrap tabular-nums">{fmtDate(exp.date)}</td>
                          <td className="px-5 py-2.5 text-gray-700">{exp.categoryName}</td>
                          <td className="px-5 py-2.5 text-gray-500 truncate">{exp.note || "—"}</td>
                          <td className="px-5 py-2.5 text-right font-medium text-red-600 whitespace-nowrap tabular-nums">
                            {currency}{exp.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return <Suspense><TopExpensesPage /></Suspense>;
}
