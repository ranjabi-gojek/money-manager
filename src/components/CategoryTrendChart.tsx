"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { CategoryPeriodSpending } from "@/lib/types";

const PARENT_COLORS: Record<string, string> = {
  Primary:   "#6366f1",
  Secondary: "#f59e0b",
  Excluded:  "#10b981",
};

const CHILD_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

function fmt(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(abs / 1_000).toFixed(0)}K`;
  return String(abs);
}

function CurrencyTooltip({
  active, payload, label, currency, highlight,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  currency: string;
  highlight?: string | null;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm min-w-40">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {[...payload].reverse().map((e) => {
        const isHighlighted = !highlight || highlight === e.name;
        return (
          <div
            key={e.name}
            className={`flex items-center justify-between gap-4 mt-0.5 ${isHighlighted && highlight ? "font-semibold" : ""}`}
            style={{ color: e.color, opacity: isHighlighted ? 1 : 0.35 }}
          >
            <span>{e.name}</span>
            <span className="tabular-nums">{currency}{e.value.toLocaleString("id-ID")}</span>
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  data: CategoryPeriodSpending[];
  currency: string;
}

export default function CategoryTrendChart({ data, currency }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  // Derive ordered periods and parent names
  const periods = useMemo(() => {
    const seen = new Set<string>();
    const result: { period: string; label: string }[] = [];
    for (const row of data) {
      if (!seen.has(row.period)) {
        seen.add(row.period);
        result.push({ period: row.period, label: row.label });
      }
    }
    return result.sort((a, b) => a.period.localeCompare(b.period));
  }, [data]);

  // Parent chart data: { period, label, Primary: n, Secondary: n, Excluded: n }
  const parentChartData = useMemo(() => {
    const byPeriod = new Map<string, Record<string, unknown>>();
    for (const { period, label } of periods) {
      byPeriod.set(period, { period, label });
    }
    for (const row of data) {
      const parent = row.parentName ?? "Other";
      const entry = byPeriod.get(row.period);
      if (entry) {
        entry[parent] = ((entry[parent] as number) ?? 0) + row.amount;
      }
    }
    return [...byPeriod.values()];
  }, [data, periods]);

  // Unique parent names (only those present in data)
  const parentNames = useMemo(() => {
    const preferred = Object.keys(PARENT_COLORS);
    const others = [...new Set(data.map((r) => r.parentName ?? "Other"))].filter(
      (n) => !preferred.includes(n)
    );
    return [...preferred.filter((p) => data.some((r) => (r.parentName ?? "Other") === p)), ...others];
  }, [data]);

  // Child chart data for the selected parent
  const { childChartData, childKeys } = useMemo(() => {
    if (!selected) return { childChartData: [], childKeys: [] };
    const rows = data.filter((r) => (r.parentName ?? "Other") === selected);
    const cats = [...new Set(rows.map((r) => r.categoryName))].sort();
    const byPeriod = new Map<string, Record<string, unknown>>();
    for (const { period, label } of periods) {
      byPeriod.set(period, { period, label });
    }
    for (const row of rows) {
      const entry = byPeriod.get(row.period);
      if (entry) {
        entry[row.categoryName] = ((entry[row.categoryName] as number) ?? 0) + row.amount;
      }
    }
    return { childChartData: [...byPeriod.values()], childKeys: cats };
  }, [data, selected, periods]);

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-center h-80 text-gray-400">
        No data for this period
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Parent stacked bar chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Expense trends by category group</h2>
        <p className="text-xs text-gray-400 mb-5">Click a bar or legend label to drill into sub-categories</p>
        <ResponsiveContainer width="100%" height={300} minWidth={0}>
          <BarChart data={parentChartData} margin={{ top: 4, right: 8, bottom: 0, left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 12, fill: "#6b7280" }} width={48} />
            <Tooltip content={<CurrencyTooltip currency={currency} highlight={selected} />} cursor={{ fill: "#f9fafb" }} />
            <Legend
              iconSize={0}
              formatter={(value) => (
                <span
                  className="cursor-pointer text-sm transition-colors"
                  style={{
                    color: selected === value ? (PARENT_COLORS[value] ?? "#374151") : selected ? "#9ca3af" : "#374151",
                    fontWeight: selected === value ? 600 : 400,
                  }}
                  onClick={() => { setSelected(selected === value ? null : value); setSelectedChild(null); }}
                >
                  {value}
                </span>
              )}
            />
            {parentNames.map((name, i) => {
              const color = PARENT_COLORS[name] ?? CHILD_COLORS[i % CHILD_COLORS.length];
              return (
                <Bar
                  key={name}
                  dataKey={name}
                  stackId="a"
                  fill={color}
                  fillOpacity={selected && selected !== name ? 0.2 : 1}
                  cursor="pointer"
                  radius={i === parentNames.length - 1 ? [4, 4, 0, 0] : undefined}
                  activeBar={{ fill: color, fillOpacity: selected && selected !== name ? 0.3 : 0.8, stroke: color, strokeWidth: 1 }}
                  onClick={() => { setSelected(selected === name ? null : name); setSelectedChild(null); }}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>

        {/* Parent breakdown table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left text-gray-400 font-normal pr-4 py-1 whitespace-nowrap w-24" />
                {periods.map(({ period, label }) => (
                  <th key={period} className="text-center text-gray-400 font-normal px-2 py-1 whitespace-nowrap">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parentNames.map((name, i) => {
                const color = PARENT_COLORS[name] ?? CHILD_COLORS[i % CHILD_COLORS.length];
                return (
                  <tr key={name} className="border-t border-gray-100">
                    <td className="pr-4 py-1.5 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-gray-500">{name}</span>
                      </span>
                    </td>
                    {periods.map(({ period }) => {
                      const entry = parentChartData.find((d) => d.period === period);
                      const v = (entry?.[name] as number) ?? 0;
                      return (
                        <td key={period} className="text-center px-2 py-1.5 font-medium tabular-nums whitespace-nowrap" style={{ color }}>
                          {v ? `${currency}${fmt(v)}` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Child drill-down stacked bar chart */}
      {selected && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-gray-800">{selected} — sub-categories</h2>
            <button
              onClick={() => { setSelected(null); setSelectedChild(null); }}
              className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              ✕ close
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-5">Click a bar or legend label to highlight a sub-category</p>
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <BarChart data={childChartData} margin={{ top: 4, right: 8, bottom: 0, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 12, fill: "#6b7280" }} width={48} />
              <Tooltip content={<CurrencyTooltip currency={currency} highlight={selectedChild} />} cursor={{ fill: "#f9fafb" }} />
              <Legend
                iconSize={0}
                formatter={(value, entry) => (
                  <span
                    className="cursor-pointer text-sm transition-colors"
                    style={{
                      color: selectedChild === value ? (entry as { color?: string }).color : selectedChild ? "#9ca3af" : "#374151",
                      fontWeight: selectedChild === value ? 600 : 400,
                    }}
                    onClick={() => setSelectedChild(selectedChild === value ? null : value)}
                  >
                    {value}
                  </span>
                )}
              />
              {childKeys.map((key, i) => {
                const color = CHILD_COLORS[i % CHILD_COLORS.length];
                return (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="b"
                    fill={color}
                    fillOpacity={selectedChild && selectedChild !== key ? 0.2 : 1}
                    cursor="pointer"
                    radius={i === childKeys.length - 1 ? [4, 4, 0, 0] : undefined}
                    activeBar={{ fill: color, fillOpacity: selectedChild && selectedChild !== key ? 0.3 : 0.8, stroke: color, strokeWidth: 1 }}
                    onClick={() => setSelectedChild(selectedChild === key ? null : key)}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>

          {/* Child breakdown table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-gray-400 font-normal pr-4 py-1 whitespace-nowrap w-24" />
                  {periods.map(({ period, label }) => (
                    <th key={period} className="text-center text-gray-400 font-normal px-2 py-1 whitespace-nowrap">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {childKeys.map((key, i) => {
                  const color = CHILD_COLORS[i % CHILD_COLORS.length];
                  return (
                    <tr key={key} className="border-t border-gray-100">
                      <td className="pr-4 py-1.5 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-gray-500">{key}</span>
                        </span>
                      </td>
                      {periods.map(({ period }) => {
                        const entry = childChartData.find((d) => d.period === period);
                        const v = (entry?.[key] as number) ?? 0;
                        return (
                          <td key={period} className="text-center px-2 py-1.5 font-medium tabular-nums whitespace-nowrap" style={{ color }}>
                            {v ? `${currency}${fmt(v)}` : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
