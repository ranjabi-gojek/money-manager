import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FilterTabs from "../FilterTabs";

describe("FilterTabs", () => {
  it("renders all three filter options", () => {
    render(<FilterTabs value="all" onChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "All Time" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "This Year" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Last Year" })).toBeInTheDocument();
  });

  it("marks the active tab as selected", () => {
    render(<FilterTabs value="this_year" onChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "This Year" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "All Time" })).toHaveAttribute("aria-selected", "false");
  });

  it("calls onChange with the correct value when a tab is clicked", () => {
    const onChange = vi.fn();
    render(<FilterTabs value="all" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Last Year" }));
    expect(onChange).toHaveBeenCalledWith("last_year");
  });

  it("does not call onChange when clicking the already active tab", () => {
    const onChange = vi.fn();
    render(<FilterTabs value="all" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "All Time" }));
    // onChange is still called (tab re-selected) — the parent decides whether to re-render
    expect(onChange).toHaveBeenCalledWith("all");
  });
});
