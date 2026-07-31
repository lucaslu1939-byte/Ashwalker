import { getDb } from "../db";

export async function getProfile(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ field_key: string; field_value: string }>(
    "SELECT field_key, field_value FROM profile_fields"
  );
  return Object.fromEntries(rows.map((row) => [row.field_key, row.field_value]));
}

export async function updateFields(updates: Record<string, string>): Promise<void> {
  const entries = Object.entries(updates);
  if (entries.length === 0) return;

  const db = await getDb();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const [key, value] of entries) {
      await db.runAsync(
        `INSERT INTO profile_fields (field_key, field_value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(field_key) DO UPDATE SET field_value = excluded.field_value, updated_at = excluded.updated_at`,
        key,
        value,
        now
      );
    }
  });
}
