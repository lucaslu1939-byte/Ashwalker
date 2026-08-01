import { getDb } from "../db";

export type DietPlan = {
  content: string;
  createdAt: string;
};

export async function getLatestPlan(): Promise<DietPlan | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ content: string; created_at: string }>(
    "SELECT content, created_at FROM diet_plans ORDER BY id DESC LIMIT 1"
  );
  if (!row) return null;
  return { content: row.content, createdAt: row.created_at };
}

export async function savePlan(content: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO diet_plans (content, created_at) VALUES (?, ?)",
    content,
    new Date().toISOString()
  );
}
