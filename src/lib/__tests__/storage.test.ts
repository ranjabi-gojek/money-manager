import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { saveBackup, loadBackup, clearBackup } from "../storage";

describe("storage (IndexedDB helpers)", () => {
  beforeEach(async () => {
    // Start each test with a clean store
    await clearBackup().catch(() => {});
  });

  it("loadBackup returns null when nothing is stored", async () => {
    const result = await loadBackup();
    expect(result).toBeNull();
  });

  it("saveBackup then loadBackup round-trips bytes and fileName", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    await saveBackup(bytes, "my-backup.mmbak");

    const record = await loadBackup();
    expect(record).not.toBeNull();
    expect(record!.fileName).toBe("my-backup.mmbak");
    expect(Array.from(record!.bytes)).toEqual([1, 2, 3, 4, 5]);
  });

  it("saveBackup overwrites the previous record", async () => {
    await saveBackup(new Uint8Array([1]), "old.mmbak");
    await saveBackup(new Uint8Array([2, 3]), "new.mmbak");

    const record = await loadBackup();
    expect(record!.fileName).toBe("new.mmbak");
    expect(Array.from(record!.bytes)).toEqual([2, 3]);
  });

  it("clearBackup removes the stored record", async () => {
    await saveBackup(new Uint8Array([7]), "test.mmbak");
    await clearBackup();
    const result = await loadBackup();
    expect(result).toBeNull();
  });
});
