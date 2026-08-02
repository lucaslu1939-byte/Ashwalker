import { createAnthropicClient, COACH_MODEL } from "../anthropic/client";
import { extractToolInput } from "../anthropic/extractToolInput";
import { SWAP_RECIPE_TOOL } from "../anthropic/tools";
import { buildSwapRecipeSystemPrompt } from "../persona/promptBuilder";
import type { MealType, SwapRecipeRequest, SwapRecipeResponse } from "../types";

const VALID_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export async function handleSwapRecipe(request: Request, env: Env): Promise<Response> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = (parsed && typeof parsed === "object" ? parsed : {}) as SwapRecipeRequest;

  if (!body.mealType || !VALID_MEAL_TYPES.includes(body.mealType)) {
    return Response.json(
      { error: "mealType must be one of breakfast, lunch, dinner" },
      { status: 400 }
    );
  }

  const profile = body.profile ?? {};
  const avoidRecipes = Array.isArray(body.avoidRecipes)
    ? body.avoidRecipes.filter((r): r is string => typeof r === "string")
    : [];
  const client = createAnthropicClient(env);

  try {
    const response = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: 512,
      system: buildSwapRecipeSystemPrompt(profile, body.mealType, avoidRecipes),
      messages: [{ role: "user", content: `Give me a different ${body.mealType} recipe.` }],
      tools: [SWAP_RECIPE_TOOL],
      tool_choice: { type: "tool", name: "swap_recipe" },
    });

    const result = extractToolInput<SwapRecipeResponse>(response.content, "swap_recipe");
    if (!result || typeof result.recipe !== "string" || result.recipe.length === 0) {
      return Response.json({ error: "Failed to generate a replacement recipe" }, { status: 502 });
    }

    return Response.json(result satisfies SwapRecipeResponse);
  } catch {
    return Response.json({ error: "Failed to generate a replacement recipe" }, { status: 502 });
  }
}
