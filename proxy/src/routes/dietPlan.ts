import { createAnthropicClient, COACH_MODEL } from "../anthropic/client";
import { extractText } from "../anthropic/extractText";
import { buildDietPlanSystemPrompt } from "../persona/promptBuilder";
import type { DietPlanRequest, DietPlanResponse } from "../types";

export async function handleDietPlan(request: Request, env: Env): Promise<Response> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = (parsed && typeof parsed === "object" ? parsed : {}) as DietPlanRequest;
  const profile = body.profile ?? {};
  const client = createAnthropicClient(env);

  try {
    const response = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: 2048,
      system: buildDietPlanSystemPrompt(profile),
      messages: [
        {
          role: "user",
          content: "Please put together my plan based on everything I've shared so far.",
        },
      ],
    });

    const result: DietPlanResponse = { plan: extractText(response.content) };
    return Response.json(result);
  } catch {
    return Response.json({ error: "Failed to generate plan" }, { status: 502 });
  }
}
