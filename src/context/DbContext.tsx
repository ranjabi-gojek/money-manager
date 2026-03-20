"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Database } from "sql.js";
import { saveBackup, loadBackup } from "@/lib/storage";

interface DbContextValue {
  db: Database | null;
  fileName: string;
  /** True while we're checking IndexedDB on first load */
  restoring: boolean;
  /** Parse bytes, persist to IndexedDB, and set the active DB */
  loadDb: (bytes: Uint8Array, fileName: string) => Promise<void>;
}

const DbContext = createContext<DbContextValue | null>(null);

async function initSql(bytes: Uint8Array): Promise<Database> {
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs({ locateFile: () => `/sql-wasm.wasm` });
  return new SQL.Database(bytes);
}

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const [fileName, setFileName] = useState("");
  const [restoring, setRestoring] = useState(true);

  // On mount: try to restore previous session from IndexedDB
  useEffect(() => {
    loadBackup()
      .then(async (record) => {
        if (record) {
          const restored = await initSql(record.bytes);
          setDb(restored);
          setFileName(record.fileName);
        }
      })
      .catch(() => {
        // IndexedDB unavailable (e.g. private browsing) — silently skip
      })
      .finally(() => setRestoring(false));
  }, []);

  const loadDb = useCallback(async (bytes: Uint8Array, name: string) => {
    const parsed = await initSql(bytes);
    setDb(parsed);
    setFileName(name);
    // Persist for future refreshes — fire-and-forget
    saveBackup(bytes, name).catch(() => {});
  }, []);

  return (
    <DbContext.Provider value={{ db, fileName, restoring, loadDb }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDb() {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error("useDb must be used within DbProvider");
  return ctx;
}
