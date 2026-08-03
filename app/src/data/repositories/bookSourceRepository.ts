import { getDb } from "../db";
import type { BookSource } from "../types";

export async function listBookSources(): Promise<BookSource[]> {
  const db = await getDb();
  return db.getAllAsync<BookSource>(
    "SELECT id, title, source_text as sourceText, char_count as charCount, created_at as createdAt FROM book_sources ORDER BY id DESC"
  );
}

export async function totalBookSourceChars(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(char_count) as total FROM book_sources"
  );
  return row?.total ?? 0;
}

export async function saveBookSource(title: string, sourceText: string): Promise<void> {
  const db = await getDb();
  // char_count includes the title, not just the excerpt — both get
  // concatenated into the prompt by getConcatenatedBookNotes, so both count
  // against the notes budget.
  await db.runAsync(
    "INSERT INTO book_sources (title, source_text, char_count, created_at) VALUES (?, ?, ?, ?)",
    title,
    sourceText,
    title.length + sourceText.length,
    new Date().toISOString()
  );
}

export async function deleteBookSource(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM book_sources WHERE id = ?", id);
}

export async function getConcatenatedBookNotes(): Promise<string | undefined> {
  const sources = await listBookSources();
  if (sources.length === 0) return undefined;
  return sources.map((s) => `--- ${s.title} ---\n${s.sourceText}`).join("\n\n");
}
