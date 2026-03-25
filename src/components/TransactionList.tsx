"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Transaction, CategoryFilter } from "@/lib/types";
import CategoryFilterPopover from "./CategoryFilterPopover";

const PAGE_SIZE_OPTIONS = [15, 30, 50, 100] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

type SortDir = "asc" | "desc" | null;

interface TransactionListProps {
  transactions: Transaction[];
  currency: string;
  selectedCategory?: string | null;
  onClearSelectedCategory?: () => void;
}

const DEFAULT_FILTER: CategoryFilter = { mode: "include", selected: new Set() };

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(iso: string): { day: string; rest: string } {
  const [y, m, d] = iso.split("-").map(Number);
  return { day: String(d), rest: `${MONTH_ABBR[m - 1]} ${String(y).slice(2)}` };
}

export default function TransactionList({ transactions, currency, selectedCategory, onClearSelectedCategory }: TransactionListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Keep a ref to current searchParams so the sync effect can read latest
  // params (e.g. tf/year/month set by the page) without depending on them.
  const searchParamsRef = useRef(searchParams);
  useEffect(() => { searchParamsRef.current = searchParams; });

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(() => {
    const ps = Number(searchParams.get("ps"));
    return PAGE_SIZE_OPTIONS.includes(ps as PageSize) ? (ps as PageSize) : DEFAULT_PAGE_SIZE;
  });
  const [sortDir, setSortDir] = useState<SortDir>(() => {
    const s = searchParams.get("sort");
    return s === "asc" || s === "desc" ? s : null;
  });
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(() => {
    const cat = searchParams.get("cat");
    const mode = searchParams.get("catMode") === "exclude" ? "exclude" : "include";
    return { mode, selected: cat ? new Set(cat.split(",").filter(Boolean)) : new Set() };
  });

  // Sync filter state → URL (preserves unrelated params like tf/year/month)
  useEffect(() => {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    if (search) params.set("q", search); else params.delete("q");
    if (pageSize !== DEFAULT_PAGE_SIZE) params.set("ps", String(pageSize)); else params.delete("ps");
    if (sortDir) params.set("sort", sortDir); else params.delete("sort");
    if (categoryFilter.selected.size > 0) {
      params.set("cat", [...categoryFilter.selected].join(","));
      if (categoryFilter.mode === "exclude") params.set("catMode", "exclude");
      else params.delete("catMode");
    } else {
      params.delete("cat");
      params.delete("catMode");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pageSize, sortDir, categoryFilter, pathname, router]);

  // Sync external category selection into the category filter (skip initial mount)
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    if (selectedCategory) {
      setCategoryFilter({ mode: "include", selected: new Set([selectedCategory]) });
    } else {
      setCategoryFilter(DEFAULT_FILTER);
    }
    setPage(1);
  }, [selectedCategory]);

  // Derive unique sorted category names from all transactions
  const allCategories = useMemo(
    () => [...new Set(transactions.map((t) => t.categoryName))].sort(),
    [transactions]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const { mode, selected } = categoryFilter;

    let base = transactions;

    // Text search
    if (q) {
      base = base.filter(
        (t) =>
          t.note.toLowerCase().includes(q) ||
          t.categoryName.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selected.size > 0) {
      base =
        mode === "include"
          ? base.filter((t) => selected.has(t.categoryName))
          : base.filter((t) => !selected.has(t.categoryName));
    }

    // Sort
    if (!sortDir) return base;
    const signed = (t: Transaction) => (t.type === 0 ? t.amount : -t.amount);
    return [...base].sort((a, b) =>
      sortDir === "desc" ? signed(b) - signed(a) : signed(a) - signed(b)
    );
  }, [transactions, search, sortDir, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value) as PageSize);
    setPage(1);
  };

  const handleCategoryFilter = (f: CategoryFilter) => {
    setCategoryFilter(f);
    setPage(1);
  };

  const cycleSort = () => {
    setSortDir((d) => (d === null ? "desc" : d === "desc" ? "asc" : null));
    setPage(1);
  };

  const isFiltered = search !== "" || sortDir !== null || categoryFilter.selected.size > 0 || pageSize !== DEFAULT_PAGE_SIZE;

  const resetFilters = () => {
    setSearch("");
    setSortDir(null);
    setCategoryFilter(DEFAULT_FILTER);
    setPageSize(DEFAULT_PAGE_SIZE);
    setPage(1);
    onClearSelectedCategory?.();
  };

  const SortIcon = sortDir === "desc" ? ArrowDown : sortDir === "asc" ? ArrowUp : ArrowUpDown;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-base font-semibold text-gray-800">
          Transactions
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({filtered.length.toLocaleString()})
          </span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryFilterPopover
            categories={allCategories}
            filter={categoryFilter}
            onChange={handleCategoryFilter}
          />
          <button
            onClick={cycleSort}
            className={`sm:hidden inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg transition-colors cursor-pointer ${sortDir ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800"}`}
          >
            Amount
            <SortIcon className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search note or category…"
              value={search}
              onChange={handleSearch}
              className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full sm:w-56"
            />
          </div>
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-400 text-sm">
          No transactions found
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <ul className="sm:hidden divide-y divide-gray-100">
            {paginated.map((tx) => {
              const { day, rest } = fmtDate(tx.date);
              return (
                <li key={tx.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">{tx.note || "—"}</p>
                    <p className="text-sm text-gray-400 truncate pt-1">{tx.categoryName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-medium tabular-nums ${tx.type === 0 ? "text-green-600" : "text-red-500"}`}>
                      {tx.type === 0 ? "+" : "-"}{currency}{tx.amount.toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-gray-400 tabular-nums">
                      <span className="inline-block w-4 text-right">{day}</span> {rest}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm table-fixed min-w-[520px]">
              <colgroup>
                <col className="w-28" />
                <col className="w-36" />
                <col />
                <col className="w-36" />
              </colgroup>
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide bg-gray-50">
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-left">Note</th>
                  <th className="px-6 py-3 text-right">
                    <button
                      onClick={cycleSort}
                      className={`inline-flex items-center gap-1 ml-auto hover:text-gray-800 transition-colors cursor-pointer ${sortDir ? "text-indigo-600" : ""}`}
                    >
                      Amount
                      <SortIcon className="w-3.5 h-3.5" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap tabular-nums">
                      {(() => { const { day, rest } = fmtDate(tx.date); return <><span className="inline-block w-5 text-right">{day}</span> {rest}</>; })()}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{tx.categoryName}</td>
                    <td className="px-6 py-3 text-gray-500 max-w-xs truncate">{tx.note || "—"}</td>
                    <td className={`px-6 py-3 text-right font-medium whitespace-nowrap ${tx.type === 0 ? "text-green-600" : "text-red-500"}`}>
                      {tx.type === 0 ? "+" : "-"}
                      {currency}{tx.amount.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4 text-sm text-gray-500 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="whitespace-nowrap">Rows per page</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={handlePageSize}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
