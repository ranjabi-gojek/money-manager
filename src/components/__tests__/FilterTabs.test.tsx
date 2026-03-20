import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FilterTabs from "../FilterTabs";

describe("FilterTabs", () => {
  it("renders all three filter options", () => {
    render(<FilterTabs value={{ type: "all" }} onChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: /All/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Year/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Month/ })).toBeInTheDocument();
  });

  it("marks the All tab as selected", () => {
    render(<FilterTabs value={{ type: "all" }} onChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: /All/ })).toHaveAttribute("aria-selected", "true");
  });

  it("marks the Year tab as selected when filter is yearly", () => {
    render(<FilterTabs value={{ type: "yearly", year: 2025 }} onChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: /Year/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /All/ })).toHaveAttribute("aria-selected", "false");
  });

  it("calls onChange with all when All tab is clicked", () => {
    const onChange = vi.fn();
    render(<FilterTabs value={{ type: "yearly", year: 2025 }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: /All/ }));
    expect(onChange).toHaveBeenCalledWith({ type: "all" });
  });
});
