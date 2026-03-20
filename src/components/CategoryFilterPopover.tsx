"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import type { CategoryFilter, CategoryFilterMode } from "@/lib/types";

interface CategoryFilterPopoverProps {
  categories: string[];
  filter: CategoryFilter;
  onChange: (f: CategoryFilter) => void;
}

export default function CategoryFilterPopover({
  categories,
  filter,
  onChange,
}: CategoryFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleCategory = useCallback(
    (name: string) => {
      const next = new Set(filter.selected);
      next.has(name) ? next.delete(name) : next.add(name);
      onChange({ ...filter, selected: next });
    },
    [filter, onChange]
  );

  const setMode = useCallback(
    (mode: CategoryFilterMode) => onChange({ ...filter, mode }),
    [filter, onChange]
  );

  const clear = useCallback(
    () => onChange({ mode: filter.mode, selected: new Set() }),
    [filter, onChange]
  );

  const activeCount = filter.selected.size;
  const isActive = activeCount > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer
          ${isActive
            ? "border-indigo-400 bg-indigo-50 text-indigo-700"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800"
          }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        {isActive ? (
          <>
            {filter.mode === "include" ? "Showing" : "Hiding"}
            <span className="font-semibold">{activeCount}</span>
            {activeCount === 1 ? "category" : "categories"}
          </>
        ) : (
          "Filter categories"
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          {/* Mode toggle */}
          <div className="px-4 pt-3 pb-2 border-b border-gray-100">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Mode</p>
            <div className="flex gap-2">
              {(["include", "exclude"] as CategoryFilterMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer
                    ${filter.mode === m
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {m === "include" ? "Include only" : "Exclude"}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {filter.mode === "include"
                ? "Show only the selected categories"
                : "Hide the selected categories"}
            </p>
          </div>

          {/* Category list */}
          <ul className="max-h-64 overflow-y-auto py-1">
            {categories.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400">No categories available</li>
            )}
            {categories.map((cat) => {
              const checked = filter.selected.has(cat);
              return (
                <li key={cat}>
                  <label className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(cat)}
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <span className={`text-sm truncate ${checked ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                      {cat}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {/* Footer */}
          {isActive && (
            <div className="px-4 py-2 border-t border-gray-100">
              <button
                onClick={clear}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
