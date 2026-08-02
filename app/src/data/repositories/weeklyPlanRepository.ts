import { getDb } from "../db";
import type { DayPlan, GroceryCategory, MealType, WeeklyPlan } from "../types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type WeeklyPlanRow = {
  week_start_date: string;
  intro_note: string;
  days_json: string;
  grocery_list_json: string | null;
};

function rowToWeeklyPlan(row: WeeklyPlanRow): WeeklyPlan {
  return {
    weekStartDate: row.week_start_date,
    introNote: row.intro_note,
    days: JSON.parse(row.days_json) as DayPlan[],
    groceryList: row.grocery_list_json ? (JSON.parse(row.grocery_list_json) as GroceryCategory[]) : null,
  };
}

export async function getCurrentWeekPlan(): Promise<WeeklyPlan | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<WeeklyPlanRow>(
    "SELECT week_start_date, intro_note, days_json, grocery_list_json FROM weekly_plans ORDER BY id DESC LIMIT 1"
  );
  return row ? rowToWeeklyPlan(row) : null;
}

export function isStale(weekStartDate: string): boolean {
  const startedAt = new Date(weekStartDate).getTime();
  if (Number.isNaN(startedAt)) return true;
  return Date.now() - startedAt >= SEVEN_DAYS_MS;
}

export async function saveNewWeeklyPlan(introNote: string, days: DayPlan[]): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    "INSERT INTO weekly_plans (week_start_date, intro_note, days_json, grocery_list_json, created_at) VALUES (?, ?, ?, NULL, ?)",
    now,
    introNote,
    JSON.stringify(days),
    now
  );
}

export async function updateDayMeal(
  dayNumber: number,
  mealType: MealType,
  newRecipe: string
): Promise<void> {
  const current = await getCurrentWeekPlan();
  if (!current) return;

  const updatedDays = current.days.map((day) =>
    day.dayNumber === dayNumber ? { ...day, [mealType]: newRecipe } : day
  );

  const db = await getDb();
  await db.runAsync(
    "UPDATE weekly_plans SET days_json = ?, grocery_list_json = NULL WHERE id = (SELECT id FROM weekly_plans ORDER BY id DESC LIMIT 1)",
    JSON.stringify(updatedDays)
  );
}

export async function saveGroceryListForCurrentWeek(categories: GroceryCategory[]): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE weekly_plans SET grocery_list_json = ? WHERE id = (SELECT id FROM weekly_plans ORDER BY id DESC LIMIT 1)",
    JSON.stringify(categories)
  );
}
