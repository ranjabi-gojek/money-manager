"use client";

import type { TimeFilter } from "@/lib/types";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface FilterTabsProps {
  value: TimeFilter;
  onChange: (filter: TimeFilter) => void;
  availableYears?: number[];
}

export default function FilterTabs({ value, onChange, availableYears }: FilterTabsProps) {
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const activeYear = value.type !== "all" ? value.year : defaultYear;
  const activeMonth = value.type === "monthly" ? value.month : defaultMonth;

  const years = availableYears && availableYears.length > 0 ? availableYears : [defaultYear];
  const allYears = years.includes(activeYear) ? years : [...years, activeYear].sort((a, b) => b - a);

  const tabBase = "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none";
  const tabActive = "bg-white text-gray-900 shadow-sm";
  const tabInactive = "text-gray-500 hover:text-gray-700";
  const selectCls = "bg-transparent text-inherit font-medium text-sm focus:outline-none cursor-pointer";

  return (
    <div role="tablist" aria-label="Time filter" className="flex gap-1 bg-gray-100 p-1 rounded-xl items-center">
      {/* Month */}
      <div
        role="tab"
        aria-selected={value.type === "monthly"}
        className={`${tabBase} ${value.type === "monthly" ? tabActive : tabInactive}`}
        onClick={() => onChange({ type: "monthly", year: activeYear, month: activeMonth })}
      >
        <span>Month</span>
        <select
          value={activeMonth}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => { e.stopPropagation(); onChange({ type: "monthly", year: activeYear, month: Number(e.target.value) }); }}
          className={selectCls}
        >
          {MONTH_NAMES.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
        </select>
      </div>

      {/* Year */}
      <div
        role="tab"
        aria-selected={value.type === "yearly"}
        className={`${tabBase} ${value.type === "yearly" ? tabActive : tabInactive}`}
        onClick={() => onChange({ type: "yearly", year: activeYear })}
      >
        <span>Year</span>
        <select
          value={activeYear}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            const newYear = Number(e.target.value);
            if (value.type === "monthly") {
              onChange({ type: "monthly", year: newYear, month: value.month });
            } else {
              onChange({ type: "yearly", year: newYear });
            }
          }}
          className={selectCls}
        >
          {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* All */}
      <button
        role="tab"
        aria-selected={value.type === "all"}
        onClick={() => onChange({ type: "all" })}
        className={`${tabBase} ${value.type === "all" ? tabActive : tabInactive}`}
      >
        All
      </button>
    </div>
  );
}
