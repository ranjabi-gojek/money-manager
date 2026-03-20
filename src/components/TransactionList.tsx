"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { Transaction } from "@/lib/types";

const PAGE_SIZE = 20;

interface TransactionListProps {
  transactions: Transaction[];
  currency: string;
}

export default function TransactionList({ transactions, currency }: TransactionListProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (t) =>
        t.note.toLowerCase().includes(q) ||
        t.categoryName.toLowerCase().includes(q)
    );
  }, [transactions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-base font-semibold text-gray-800">
          Transactions
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({filtered.length.toLocaleString()})
          </span>
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search note or category…"
            value={search}
            onChange={handleSearch}
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 w-56"
          />
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-400 text-sm">
          No transactions found
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wide bg-gray-50">
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Note</th>
              <th className="px-6 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{tx.date}</td>
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
      )}

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
