import { createAnthropicClient, COACH_MODEL } from "../anthropic/client";
import type { CoachRequest, CoachResponse } from "../types";

// Placeholder system prompt. Replaced with the real safety + persona
// composition in a later step.
const SYSTEM_PROMPT = "You are a warm, supportive wellness coach.";

export async function handleCoach(request: Request, env: Env): Promise<Response> {
  let body: CoachRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return Response.json({ error: "messages must be an array" }, { status: 400 });
  }

  const client = createAnthropicClient(env);

  const response = await client.messages.create({
    model: COACH_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const reply = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const result: CoachResponse = { reply, profileUpdates: {} };
  return Response.json(result);
}
