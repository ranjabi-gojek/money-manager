import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryFilterPopover from "../CategoryFilterPopover";
import type { CategoryFilter } from "@/lib/types";

const CATEGORIES = ["Food", "Transport", "Salary"];

function makeFilter(overrides?: Partial<CategoryFilter>): CategoryFilter {
  return { mode: "include", selected: new Set(), ...overrides };
}

describe("CategoryFilterPopover", () => {
  it("renders the trigger button", () => {
    render(
      <CategoryFilterPopover
        categories={CATEGORIES}
        filter={makeFilter()}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Filter categories")).toBeInTheDocument();
  });

  it("opens popover on click and shows categories", () => {
    render(
      <CategoryFilterPopover
        categories={CATEGORIES}
        filter={makeFilter()}
        onChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Filter categories"));
    expect(screen.getByLabelText("Food")).toBeInTheDocument();
    expect(screen.getByLabelText("Transport")).toBeInTheDocument();
    expect(screen.getByLabelText("Salary")).toBeInTheDocument();
  });

  it("calls onChange with added category when checkbox is clicked", () => {
    const onChange = vi.fn();
    render(
      <CategoryFilterPopover
        categories={CATEGORIES}
        filter={makeFilter()}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText("Filter categories"));
    fireEvent.click(screen.getByLabelText("Food"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ selected: new Set(["Food"]) })
    );
  });

  it("calls onChange with removed category when checked category is clicked again", () => {
    const onChange = vi.fn();
    render(
      <CategoryFilterPopover
        categories={CATEGORIES}
        filter={makeFilter({ selected: new Set(["Food"]) })}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText(/Showing/));
    fireEvent.click(screen.getByLabelText("Food"));
    const nextSelected: Set<string> = onChange.mock.calls[0][0].selected;
    expect(nextSelected.has("Food")).toBe(false);
  });

  it("switches mode to exclude", () => {
    const onChange = vi.fn();
    render(
      <CategoryFilterPopover
        categories={CATEGORIES}
        filter={makeFilter()}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText("Filter categories"));
    fireEvent.click(screen.getByText("Exclude"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "exclude" })
    );
  });

  it("shows active state in trigger when categories are selected", () => {
    render(
      <CategoryFilterPopover
        categories={CATEGORIES}
        filter={makeFilter({ selected: new Set(["Food", "Transport"]) })}
        onChange={vi.fn()}
      />
    );
    // Button label text is split across spans; match by the container button
    const btn = screen.getByRole("button");
    expect(btn.textContent).toContain("2");
    expect(btn.textContent).toContain("categories");
  });

  it("clears filter when Clear button is clicked", () => {
    const onChange = vi.fn();
    render(
      <CategoryFilterPopover
        categories={CATEGORIES}
        filter={makeFilter({ selected: new Set(["Food"]) })}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText(/Showing/));
    fireEvent.click(screen.getByText("Clear filter"));
    const call = onChange.mock.calls[0][0] as CategoryFilter;
    expect(call.selected.size).toBe(0);
  });
});
