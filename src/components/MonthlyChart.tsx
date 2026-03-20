"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MonthlyTotal } from "@/lib/types";

function formatYAxis(value: number): string {
  const abs = Math.abs(value);
  const formatted =
    abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)}M`
    : abs >= 1_000 ? `${(abs / 1_000).toFixed(0)}K`
    : String(abs);
  return value < 0 ? `-${formatted}` : formatted;
}

interface MonthlyChartProps {
  data: MonthlyTotal[];
  currency: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="mt-0.5">
          {entry.name}: {currency}{entry.value.toLocaleString("id-ID")}
        </p>
      ))}
    </div>
  );
}

export default function MonthlyChart({ data, currency }: MonthlyChartProps) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-center h-80 text-gray-400">
        No data for this period
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-6">Income vs Expense per Month</h2>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 64, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tickFormatter={(v) => formatYAxis(v)}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            width={52}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 16 }} />
          <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Line
            dataKey="balance"
            name="Balance"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            type="monotone"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
