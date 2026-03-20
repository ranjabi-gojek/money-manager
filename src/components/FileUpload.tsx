"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileArchive, AlertCircle } from "lucide-react";
import { useDb } from "@/context/DbContext";

export default function FileUpload() {
  const { setDb, setFileName } = useDb();
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".mmbak")) {
        setError("Please upload a .mmbak file.");
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const initSqlJs = (await import("sql.js")).default;
        const SQL = await initSqlJs({
          locateFile: () => `/sql-wasm.wasm`,
        });

        const buffer = await file.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(buffer));

        setDb(db);
        setFileName(file.name);
        router.push("/dashboard");
      } catch {
        setError("Failed to parse the file. Make sure it's a valid .mmbak backup.");
      } finally {
        setLoading(false);
      }
    },
    [setDb, setFileName, router]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`w-full border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors
          ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"}`}
      >
        <FileArchive className="w-12 h-12 text-gray-400" />
        <div className="text-center">
          <p className="text-gray-700 font-medium">Drop your .mmbak file here</p>
          <p className="text-gray-500 text-sm mt-1">or click to browse</p>
        </div>
        <label className="cursor-pointer bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {loading ? "Loading…" : "Choose File"}
          <input
            type="file"
            accept=".mmbak"
            className="hidden"
            onChange={onFileChange}
            disabled={loading}
          />
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 w-full">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Your file is processed entirely in your browser — nothing is uploaded to any server.
      </p>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Upload className="w-3 h-3" />
        Export from Money Manager → Settings → Backup → Local Backup
      </div>
    </div>
  );
}
