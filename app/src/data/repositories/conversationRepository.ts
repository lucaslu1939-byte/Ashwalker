import { getDb } from "../db";
import type { ChatMessage } from "../types";

export async function getMessages(): Promise<ChatMessage[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ role: string; content: string }>(
    "SELECT role, content FROM messages ORDER BY id ASC"
  );
  return rows.map((row) => ({ role: row.role as ChatMessage["role"], content: row.content }));
}

export async function appendMessage(role: ChatMessage["role"], content: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO messages (role, content, created_at) VALUES (?, ?, ?)",
    role,
    content,
    new Date().toISOString()
  );
}
