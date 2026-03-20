"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Database } from "sql.js";

interface DbContextValue {
  db: Database | null;
  setDb: (db: Database) => void;
  fileName: string;
  setFileName: (name: string) => void;
}

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const [fileName, setFileName] = useState("");

  return (
    <DbContext.Provider value={{ db, setDb, fileName, setFileName }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDb() {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error("useDb must be used within DbProvider");
  return ctx;
}
