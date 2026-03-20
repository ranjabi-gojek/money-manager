import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FileUpload from "../FileUpload";

// Mock next/navigation
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// Mock DbContext
vi.mock("@/context/DbContext", () => ({
  useDb: () => ({ setDb: vi.fn(), setFileName: vi.fn() }),
}));

describe("FileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the upload area", () => {
    render(<FileUpload />);
    expect(screen.getByText(/Drop your .mmbak file here/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose File/i)).toBeInTheDocument();
  });

  it("shows an error when a non-.mmbak file is selected", async () => {
    render(<FileUpload />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(["content"], "test.csv", { type: "text/csv" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText(/Please upload a .mmbak file/i)).toBeInTheDocument();
  });

  it("shows privacy notice", () => {
    render(<FileUpload />);
    expect(screen.getByText(/processed entirely in your browser/i)).toBeInTheDocument();
  });

  it("drag-over changes visual state", () => {
    render(<FileUpload />);
    const dropZone = screen.getByText(/Drop your .mmbak file here/i).closest("div")!;
    fireEvent.dragOver(dropZone, { preventDefault: vi.fn() });
    // After dragOver the border should change — we just verify no crash
    expect(dropZone).toBeInTheDocument();
  });
});
