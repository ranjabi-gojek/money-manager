"use client";

import { Fragment } from "react";
import type { CategorySpending } from "@/lib/types";

interface CategoryTableProps {
  data: CategorySpending[];
  currency: string;
  selectedCategory?: string | null;
  onCategoryClick?: (category: string) => void;
}

// Row height in px (py-2.5 top+bottom = 20px + ~21px text line = ~41px)
const ROW_PX = 41;
const GROUP_HEADER_PX = 32; // py-1.5 header row
const DEFAULT_VISIBLE_ROWS = 6;

// Three-section layout: fixed header | scrollable tbody | pinned footer.
// All three tables share identical colgroup widths (table-fixed) so
// columns stay perfectly aligned regardless of content.
export default function CategoryTable({ data, currency, selectedCategory, onCategoryClick }: CategoryTableProps) {
  const total = data.reduce((sum, c) => sum + c.total, 0);

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm text-gray-400 text-center">
        No spending data for this period
      </div>
    );
  }

  // Group rows by parent category, preserving order from the query
  type Group = { parentName: string | null; rows: CategorySpending[]; subtotal: number; subcount: number };
  const groups: Group[] = [];
  const groupMap = new Map<string | null, Group>();
  for (const row of data) {
    const key = row.parentName ?? null;
    if (!groupMap.has(key)) {
      const g: Group = { parentName: key, rows: [], subtotal: 0, subcount: 0 };
      groupMap.set(key, g);
      groups.push(g);
    }
    const g = groupMap.get(key)!;
    g.rows.push(row);
    g.subtotal += row.total;
    g.subcount += row.count;
  }
  groups.sort((a, b) => b.subtotal - a.subtotal);

  // Estimate scrollable height: each group contributes a header row + its category rows
  const visibleHeight = Math.min(
    groups.reduce((h, g) => h + GROUP_HEADER_PX + g.rows.length * ROW_PX, 0),
    GROUP_HEADER_PX * groups.length + ROW_PX * DEFAULT_VISIBLE_ROWS
  );

  // Shared colgroup — must be identical in all three tables
  const Cols = () => (
    <colgroup>
      <col style={{ width: "44%" }} />
      <col style={{ width: "12%" }} />
      <col style={{ width: "28%" }} />
      <col style={{ width: "16%" }} />
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

      {/* Scrollable body */}
      <div className="overflow-y-auto" style={{ maxHeight: visibleHeight }}>
        <table className="w-full text-sm table-fixed">
          <Cols />
          <tbody>
            {groups.map((group) => (
              <Fragment key={`group-${group.parentName}`}>
                {/* Parent group header */}
                <tr className="bg-gray-50 border-t border-gray-100">
                  <td colSpan={2} className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {group.parentName ?? "Other"}
                  </td>
                  <td className="px-4 py-1.5 text-right text-xs font-semibold text-gray-500">
                    {currency}{group.subtotal.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-1.5 text-right text-xs text-gray-400 tabular-nums">
                    {total > 0 ? ((group.subtotal / total) * 100).toFixed(1) : "0.0"}%
                  </td>
                </tr>
                {/* Category rows */}
                {group.rows.map((row) => {
                  const share = total > 0 ? (row.total / total) * 100 : 0;
                  const isSelected = selectedCategory === row.categoryName;
                  return (
                    <tr
                      key={row.categoryName}
                      onClick={() => onCategoryClick?.(row.categoryName)}
                      className={`transition-colors divide-y divide-gray-50 ${onCategoryClick ? "cursor-pointer" : ""} ${isSelected ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                    >
                      <td className="pl-6 pr-4 py-2.5 text-gray-800 truncate">{row.categoryName}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{row.count}</td>
                      <td className="px-4 py-2.5 text-right text-gray-900 font-medium">
                        {currency}{row.total.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500 tabular-nums">
                        {share.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
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
            <td className="px-4 py-2.5 text-right">
              {currency}{total.toLocaleString("id-ID")}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
