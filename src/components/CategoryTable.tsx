"use client";

import type { CategorySpending } from "@/lib/types";

interface CategoryTableProps {
  data: CategorySpending[];
  currency: string;
}

// Row height in px (py-2.5 top+bottom = 20px + ~21px text line = ~41px)
const ROW_PX = 41;
const DEFAULT_VISIBLE_ROWS = 6;

// Three-section layout: fixed header | scrollable tbody | pinned footer.
// All three tables share identical colgroup widths (table-fixed) so
// columns stay perfectly aligned regardless of content.
export default function CategoryTable({ data, currency }: CategoryTableProps) {
  const total = data.reduce((sum, c) => sum + c.total, 0);

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm text-gray-400 text-center">
        No spending data for this period
      </div>
    );
  }

  // Shared colgroup — must be identical in all three tables
  const Cols = () => (
    <colgroup>
      <col style={{ width: "40%" }} />
      <col style={{ width: "12%" }} />
      <col style={{ width: "24%" }} />
      <col style={{ width: "24%" }} />
    </colgroup>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Title */}
      <div className="px-4 py-4 border-b border-gray-100 shrink-0">
        <h2 className="text-base font-semibold text-gray-800">Category Breakdown</h2>
      </div>

      {/* Fixed header */}
      <table className="w-full text-sm table-fixed shrink-0">
        <Cols />
        <thead>
          <tr className="text-gray-500 text-xs uppercase tracking-wide bg-gray-50">
            <th className="px-4 py-2 text-left">Category</th>
            <th className="px-4 py-2 text-right">Txns</th>
            <th className="px-4 py-2 text-right">Amount</th>
            <th className="px-4 py-2 text-right">Share</th>
          </tr>
        </thead>
      </table>

      {/* Scrollable body — capped at 6 rows */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: ROW_PX * DEFAULT_VISIBLE_ROWS }}
      >
        <table className="w-full text-sm table-fixed">
          <Cols />
          <tbody className="divide-y divide-gray-50">
            {data.map((row) => {
              const share = total > 0 ? (row.total / total) * 100 : 0;
              return (
                <tr key={row.categoryName} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-gray-800 truncate">
                    {row.categoryName}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{row.count}</td>
                  <td className="px-4 py-2.5 text-right text-gray-900 font-medium truncate">
                    {currency}{row.total.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-10 bg-gray-100 rounded-full h-1.5 overflow-hidden shrink-0">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="text-gray-500 tabular-nums w-[38px] text-right shrink-0">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pinned footer — always at the bottom of the card */}
      <table className="w-full text-sm table-fixed shrink-0 border-t border-gray-200">
        <Cols />
        <tfoot>
          <tr className="font-semibold text-gray-800 bg-gray-50">
            <td className="px-4 py-2.5">Total</td>
            <td className="px-4 py-2.5 text-right text-gray-500">
              {data.reduce((s, c) => s + c.count, 0)}
            </td>
            <td className="px-4 py-2.5 text-right truncate">
              {currency}{total.toLocaleString("id-ID")}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
