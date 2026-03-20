"use client";

import type { TimeFilter } from "@/lib/types";

const OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "this_year", label: "This Year" },
  { value: "last_year", label: "Last Year" },
];

interface FilterTabsProps {
  value: TimeFilter;
  onChange: (filter: TimeFilter) => void;
}

export default function FilterTabs({ value, onChange }: FilterTabsProps) {
  return (
    <div role="tablist" aria-label="Time filter" className="flex gap-1 bg-gray-100 p-1 rounded-xl">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${value === opt.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
