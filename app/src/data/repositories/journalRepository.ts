import { getDb } from "../db";
import type { JournalEntry } from "../types";

const HISTORY_DAYS = 14;
const SUMMARY_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const NOTES_LIMIT = 500;

function isValidScale(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

type JournalRow = {
  entry_date: string;
  mood: number;
  energy: number;
  did_morning_routine: number;
  did_meals: number;
  did_movement: number;
  did_meditation: number;
  notes: string | null;
  updated_at: string;
};

function rowToEntry(row: JournalRow): JournalEntry {
  return {
    entryDate: row.entry_date,
    mood: row.mood,
    energy: row.energy,
    didMorningRoutine: row.did_morning_routine === 1,
    didMeals: row.did_meals === 1,
    didMovement: row.did_movement === 1,
    didMeditation: row.did_meditation === 1,
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function cutoffDateString(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);
}

export async function getEntry(entryDate: string): Promise<JournalEntry | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<JournalRow>(
    "SELECT * FROM journal_entries WHERE entry_date = ?",
    entryDate
  );
  return row ? rowToEntry(row) : null;
}

export type SaveJournalEntryFields = {
  mood: number;
  energy: number;
  didMorningRoutine: boolean;
  didMeals: boolean;
  didMovement: boolean;
  didMeditation: boolean;
  notes: string | null;
};

export async function saveEntry(entryDate: string, fields: SaveJournalEntryFields): Promise<void> {
  if (!isValidScale(fields.mood) || !isValidScale(fields.energy)) {
    throw new Error("Mood and energy must be whole numbers from 1 to 5.");
  }
  const notes = fields.notes ? fields.notes.slice(0, NOTES_LIMIT) : null;

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO journal_entries
       (entry_date, mood, energy, did_morning_routine, did_meals, did_movement, did_meditation, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(entry_date) DO UPDATE SET
       mood = excluded.mood,
       energy = excluded.energy,
       did_morning_routine = excluded.did_morning_routine,
       did_meals = excluded.did_meals,
       did_movement = excluded.did_movement,
       did_meditation = excluded.did_meditation,
       notes = excluded.notes,
       updated_at = excluded.updated_at`,
    entryDate,
    fields.mood,
    fields.energy,
    fields.didMorningRoutine ? 1 : 0,
    fields.didMeals ? 1 : 0,
    fields.didMovement ? 1 : 0,
    fields.didMeditation ? 1 : 0,
    notes,
    new Date().toISOString()
  );
}

export async function listRecentEntries(): Promise<JournalEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<JournalRow>(
    "SELECT * FROM journal_entries WHERE entry_date >= ? ORDER BY entry_date DESC",
    cutoffDateString(HISTORY_DAYS)
  );
  return rows.map(rowToEntry);
}

function summarizeAdherence(entry: JournalEntry): string {
  const labels: [boolean, string][] = [
    [entry.didMorningRoutine, "Morning Routine"],
    [entry.didMeals, "Meals"],
    [entry.didMovement, "Movement"],
    [entry.didMeditation, "Meditation"],
  ];
  const followed = labels.filter(([done]) => done).map(([, label]) => label);
  const skipped = labels.filter(([done]) => !done).map(([, label]) => label);

  const parts: string[] = [];
  parts.push(followed.length > 0 ? `followed ${followed.join("+")}` : "followed none of the plan");
  if (skipped.length > 0) parts.push(`skipped ${skipped.join("+")}`);
  return parts.join(", ");
}

export async function getJournalSummaryForPrompt(): Promise<string | undefined> {
  const db = await getDb();
  const rows = await db.getAllAsync<JournalRow>(
    "SELECT * FROM journal_entries WHERE entry_date >= ? ORDER BY entry_date ASC",
    cutoffDateString(SUMMARY_DAYS)
  );
  if (rows.length === 0) return undefined;

  // The model has no inherent sense of "today" — without this, it can
  // mislabel a same-day entry as "yesterday" or similar when talking about it.
  const lines = [`Today's date is ${todayDateString()}.`];
  lines.push(
    ...rows.map(rowToEntry).map((entry) => {
      const notesPart = entry.notes ? ` Notes: ${entry.notes}` : "";
      return `${entry.entryDate}: mood ${entry.mood}/5, energy ${entry.energy}/5, ${summarizeAdherence(entry)}.${notesPart}`;
    })
  );
  return lines.join("\n");
}
