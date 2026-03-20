"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CategorySpending } from "@/lib/types";

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

interface SpendingChartProps {
  data: CategorySpending[];
  currency: string;
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ payload: CategorySpending; value: number }>;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const { categoryName, count } = payload[0].payload;
  const total = payload[0].value;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-800">{categoryName}</p>
      <p className="text-gray-600 mt-1">
        {currency}{total.toLocaleString("id-ID")}
      </p>
      <p className="text-gray-400">{count} transaction{count !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default function SpendingChart({ data, currency }: SpendingChartProps) {
  const top = data.slice(0, 10);

  if (!top.length) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-center h-64 text-gray-400">
        No spending data for this period
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <h2 className="text-base font-semibold text-gray-800 mb-4 shrink-0">Spending by Category</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} margin={{ top: 0, right: 0, bottom: 60, left: 10 }}>
          <XAxis
            dataKey="categoryName"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            width={48}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {top.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { formatYAxis };
