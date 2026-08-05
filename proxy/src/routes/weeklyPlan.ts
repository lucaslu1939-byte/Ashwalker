import { createAnthropicClient, COACH_MODEL } from "../anthropic/client";
import { extractToolInput } from "../anthropic/extractToolInput";
import { GENERATE_WEEKLY_PLAN_TOOL } from "../anthropic/tools";
import { buildWeeklyPlanSystemPrompt } from "../persona/promptBuilder";
import type { DayPlan, WeeklyPlanRequest, WeeklyPlanResponse } from "../types";

const REQUIRED_DAY_FIELDS: (keyof DayPlan)[] = [
  "morningRoutine",
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "movement",
  "meditation",
  "frequencyHealing",
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// The model occasionally serializes the `days` array as a JSON *string*
// instead of a native nested array — likely due to the schema's size and
// nesting depth. Recover from that specific shape before falling back to
// rejecting the response outright.
function normalizeDays(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isValidWeeklyPlan(value: unknown): value is WeeklyPlanResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<WeeklyPlanResponse>;
  const days = normalizeDays(candidate.days);
  if (!isNonEmptyString(candidate.introNote) || !Array.isArray(days)) return false;
  candidate.days = days;
  if (candidate.days.length !== 7) return false;

  const seenDayNumbers = new Set<number>();
  for (const day of candidate.days) {
    if (!day || typeof day !== "object") return false;
    const dayNumber = (day as Partial<DayPlan>).dayNumber;
    if (typeof dayNumber !== "number" || !Number.isInteger(dayNumber)) return false;
    if (dayNumber < 1 || dayNumber > 7) return false;
    seenDayNumbers.add(dayNumber);
    if (!REQUIRED_DAY_FIELDS.every((field) => isNonEmptyString((day as DayPlan)[field]))) {
      return false;
    }
  }
  // Every day 1-7 must appear exactly once (the Set catches duplicates
  // implicitly since it can hold at most 7 distinct values here).
  return seenDayNumbers.size === 7;
}

export async function handleWeeklyPlan(request: Request, env: Env): Promise<Response> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = (parsed && typeof parsed === "object" ? parsed : {}) as WeeklyPlanRequest;
  const profile = body.profile ?? {};
  const client = createAnthropicClient(env);

  try {
    const response = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: 6144,
      system: buildWeeklyPlanSystemPrompt(profile, body.bookNotes, body.journalSummary),
      messages: [
        {
          role: "user",
          content: "Please put together my full 7-day plan based on everything I've shared so far.",
        },
      ],
      tools: [GENERATE_WEEKLY_PLAN_TOOL],
      tool_choice: { type: "tool", name: "generate_weekly_plan" },
    });

    const plan = extractToolInput<WeeklyPlanResponse>(response.content, "generate_weekly_plan");
    if (!isValidWeeklyPlan(plan)) {
      return Response.json({ error: "Generated plan was incomplete" }, { status: 502 });
    }

    return Response.json(plan satisfies WeeklyPlanResponse);
  } catch {
    return Response.json({ error: "Failed to generate weekly plan" }, { status: 502 });
  }
}
