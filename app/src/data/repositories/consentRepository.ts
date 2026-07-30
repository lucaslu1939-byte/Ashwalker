import { getDb } from "../db";

// Bump this when the disclaimer text changes materially to force re-consent.
export const DISCLAIMER_VERSION = "2026-07-30";

export async function hasConsented(): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM consent WHERE disclaimer_version = ?",
    DISCLAIMER_VERSION
  );
  return (row?.count ?? 0) > 0;
}

export async function recordConsent(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO consent (disclaimer_version, accepted_at) VALUES (?, ?)",
    DISCLAIMER_VERSION,
    new Date().toISOString()
  );
}
