import { createAnthropicClient, COACH_MODEL } from "../anthropic/client";
import { extractToolInput } from "../anthropic/extractToolInput";
import { GENERATE_GROCERY_LIST_TOOL } from "../anthropic/tools";
import { buildGroceryListSystemPrompt } from "../persona/promptBuilder";
import type { DayPlan, GroceryCategory, GroceryListRequest, GroceryListResponse } from "../types";

const MAX_DAYS = 7;
const MAX_FIELD_LENGTH = 500;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isReasonableMealText(value: unknown): value is string {
  return isNonEmptyString(value) && value.length <= MAX_FIELD_LENGTH;
}

function isValidDay(value: unknown): value is DayPlan {
  if (!value || typeof value !== "object") return false;
  const day = value as Partial<DayPlan>;
  return (
    isReasonableMealText(day.breakfast) &&
    isReasonableMealText(day.lunch) &&
    isReasonableMealText(day.dinner)
  );
}

// celeryJuice and heavyMetalDetoxSmoothie are the same recipe every day, so
// only include them once (from whichever day has them) rather than 7x
// repeated identical text bloating the prompt.
function findDailyStaple(days: DayPlan[], field: "celeryJuice" | "heavyMetalDetoxSmoothie"): string | null {
  const day = days.find((d) => isReasonableMealText(d[field]));
  return day ? day[field] : null;
}

function isValidGroceryResponse(value: unknown): value is GroceryListResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GroceryListResponse>;
  if (!Array.isArray(candidate.categories) || candidate.categories.length === 0) return false;
  return candidate.categories.every((category) => {
    if (!category || typeof category !== "object") return false;
    const c = category as Partial<GroceryCategory>;
    return (
      isNonEmptyString(c.name) &&
      Array.isArray(c.items) &&
      c.items.length > 0 &&
      c.items.every((item) => isNonEmptyString(item))
    );
  });
}

function renderWeekRecipes(days: DayPlan[]): string {
  const dailyLines = days
    .map(
      (day, i) =>
        `Day ${day.dayNumber ?? i + 1}: Breakfast - ${day.breakfast}; Lunch - ${day.lunch}; Dinner - ${day.dinner}`
    )
    .join("\n");

  const staples = [
    findDailyStaple(days, "celeryJuice") ? `Daily: ${findDailyStaple(days, "celeryJuice")}` : null,
    findDailyStaple(days, "heavyMetalDetoxSmoothie")
      ? `Daily: ${findDailyStaple(days, "heavyMetalDetoxSmoothie")}`
      : null,
  ].filter((line): line is string => line !== null);

  return [...staples, dailyLines].join("\n");
}

export async function handleGroceryList(request: Request, env: Env): Promise<Response> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = (parsed && typeof parsed === "object" ? parsed : {}) as GroceryListRequest;
  const rawDays = Array.isArray(body.days) ? body.days : [];

  if (rawDays.length > MAX_DAYS) {
    return Response.json({ error: `days must include at most ${MAX_DAYS} entries` }, { status: 400 });
  }

  const days = rawDays.filter(isValidDay);

  if (days.length === 0) {
    return Response.json({ error: "days must include at least one valid day's meals" }, { status: 400 });
  }

  const client = createAnthropicClient(env);

  try {
    const response = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: 2048,
      system: buildGroceryListSystemPrompt(renderWeekRecipes(days)),
      messages: [{ role: "user", content: "Please build my grocery list for this week." }],
      tools: [GENERATE_GROCERY_LIST_TOOL],
      tool_choice: { type: "tool", name: "generate_grocery_list" },
    });

    const result = extractToolInput<GroceryListResponse>(response.content, "generate_grocery_list");
    if (!isValidGroceryResponse(result)) {
      return Response.json({ error: "Failed to generate grocery list" }, { status: 502 });
    }

    return Response.json(result satisfies GroceryListResponse);
  } catch {
    return Response.json({ error: "Failed to generate grocery list" }, { status: 502 });
  }
}
