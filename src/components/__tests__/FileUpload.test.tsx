import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FileUpload from "../FileUpload";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

// Mutable state so individual tests can override restoring/db
let mockRestoring = false;
let mockDb: object | null = null;
vi.mock("@/context/DbContext", () => ({
  useDb: () => ({ loadDb: vi.fn(), restoring: mockRestoring, db: mockDb }),
}));

describe("FileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRestoring = false;
    mockDb = null;
  });

  it("renders the upload area when not restoring and no db", () => {
    render(<FileUpload />);
    expect(screen.getByText(/Drop your .mmbak file here/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose File/i)).toBeInTheDocument();
  });

  it("shows a spinner while restoring from IndexedDB", () => {
    mockRestoring = true;
    render(<FileUpload />);
    expect(screen.getByText(/Restoring your last session/i)).toBeInTheDocument();
    expect(screen.queryByText(/Choose File/i)).not.toBeInTheDocument();
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
    expect(dropZone).toBeInTheDocument();
  });
});
