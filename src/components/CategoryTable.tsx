"use client";

import type { CategorySpending } from "@/lib/types";

interface CategoryTableProps {
  data: CategorySpending[];
  currency: string;
}

export default function CategoryTable({ data, currency }: CategoryTableProps) {
  const total = data.reduce((sum, c) => sum + c.total, 0);

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm text-gray-400 text-center">
        No spending data for this period
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">Category Breakdown</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase tracking-wide bg-gray-50">
            <th className="px-6 py-3 text-left">Category</th>
            <th className="px-6 py-3 text-right">Transactions</th>
            <th className="px-6 py-3 text-right">Amount</th>
            <th className="px-6 py-3 text-right">Share</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row) => {
            const share = total > 0 ? (row.total / total) * 100 : 0;
            return (
              <tr key={row.categoryName} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 font-medium text-gray-800">{row.categoryName}</td>
                <td className="px-6 py-3 text-right text-gray-500">{row.count}</td>
                <td className="px-6 py-3 text-right text-gray-900 font-medium">
                  {currency}{row.total.toLocaleString("id-ID")}
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <span className="text-gray-500 w-10 text-right">{share.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold text-gray-800">
            <td className="px-6 py-3">Total</td>
            <td className="px-6 py-3 text-right text-gray-500">
              {data.reduce((s, c) => s + c.count, 0)}
            </td>
            <td className="px-6 py-3 text-right">
              {currency}{total.toLocaleString("id-ID")}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
