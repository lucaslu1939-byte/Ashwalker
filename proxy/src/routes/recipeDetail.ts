import { createAnthropicClient, COACH_MODEL } from "../anthropic/client";
import { extractToolInput } from "../anthropic/extractToolInput";
import { RECIPE_DETAIL_TOOL } from "../anthropic/tools";
import { buildRecipeDetailSystemPrompt } from "../persona/promptBuilder";
import type { RecipeDetailRequest, RecipeDetailResponse } from "../types";

const MAX_MEAL_TEXT_LENGTH = 500;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidRecipeDetail(value: unknown): value is RecipeDetailResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RecipeDetailResponse>;
  return (
    Array.isArray(candidate.ingredients) &&
    candidate.ingredients.length > 0 &&
    candidate.ingredients.every(isNonEmptyString) &&
    Array.isArray(candidate.instructions) &&
    candidate.instructions.length > 0 &&
    candidate.instructions.every(isNonEmptyString)
  );
}

export async function handleRecipeDetail(request: Request, env: Env): Promise<Response> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = (parsed && typeof parsed === "object" ? parsed : {}) as RecipeDetailRequest;

  if (!isNonEmptyString(body.mealText) || body.mealText.length > MAX_MEAL_TEXT_LENGTH) {
    return Response.json(
      { error: `mealText must be a non-empty string up to ${MAX_MEAL_TEXT_LENGTH} characters` },
      { status: 400 }
    );
  }

  const profile = body.profile ?? {};
  const client = createAnthropicClient(env);

  try {
    const response = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: 1024,
      system: buildRecipeDetailSystemPrompt(profile, body.mealText),
      messages: [{ role: "user", content: "Give me the full recipe for this." }],
      tools: [RECIPE_DETAIL_TOOL],
      tool_choice: { type: "tool", name: "recipe_detail" },
    });

    const result = extractToolInput<RecipeDetailResponse>(response.content, "recipe_detail");
    if (!isValidRecipeDetail(result)) {
      return Response.json({ error: "Failed to generate the recipe" }, { status: 502 });
    }

    return Response.json(result satisfies RecipeDetailResponse);
  } catch {
    return Response.json({ error: "Failed to generate the recipe" }, { status: 502 });
  }
}
