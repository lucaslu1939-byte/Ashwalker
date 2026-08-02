import { getDb } from "../db";
import type { RecipeDetail } from "../types";

export async function getCachedRecipeDetail(mealText: string): Promise<RecipeDetail | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ ingredients_json: string; instructions_json: string }>(
    "SELECT ingredients_json, instructions_json FROM recipe_details WHERE meal_text = ?",
    mealText
  );
  if (!row) return null;
  return {
    ingredients: JSON.parse(row.ingredients_json) as string[],
    instructions: JSON.parse(row.instructions_json) as string[],
  };
}

export async function cacheRecipeDetail(mealText: string, detail: RecipeDetail): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO recipe_details (meal_text, ingredients_json, instructions_json, created_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(meal_text) DO UPDATE SET ingredients_json = excluded.ingredients_json, instructions_json = excluded.instructions_json`,
    mealText,
    JSON.stringify(detail.ingredients),
    JSON.stringify(detail.instructions),
    new Date().toISOString()
  );
}
