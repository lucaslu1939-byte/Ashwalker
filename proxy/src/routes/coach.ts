import type Anthropic from "@anthropic-ai/sdk";
import { createAnthropicClient, COACH_MODEL } from "../anthropic/client";
import { UPDATE_PROFILE_TOOL } from "../anthropic/tools";
import { buildSystemPrompt } from "../persona/promptBuilder";
import type { CoachRequest, CoachResponse } from "../types";

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

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
  const profile = body.profile ?? {};
  const system = buildSystemPrompt(profile);
  const messages: Anthropic.MessageParam[] = body.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const first = await client.messages.create({
    model: COACH_MODEL,
    max_tokens: 1024,
    system,
    messages,
    tools: [UPDATE_PROFILE_TOOL],
  });

  if (first.stop_reason !== "tool_use") {
    const result: CoachResponse = { reply: extractText(first.content), profileUpdates: {} };
    return Response.json(result);
  }

  const toolUseBlocks = first.content.filter(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  const profileUpdates: Record<string, string> = {};
  for (const block of toolUseBlocks) {
    if (block.name !== "update_profile" || typeof block.input !== "object" || block.input === null) {
      continue;
    }
    for (const [key, value] of Object.entries(block.input as Record<string, unknown>)) {
      if (typeof value === "string" && value.length > 0) {
        profileUpdates[key] = value;
      }
    }
  }

  const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((block) => ({
    type: "tool_result",
    tool_use_id: block.id,
    content: "ok",
  }));

  const followUp = await client.messages.create({
    model: COACH_MODEL,
    max_tokens: 1024,
    system,
    messages: [
      ...messages,
      { role: "assistant", content: first.content },
      { role: "user", content: toolResults },
    ],
    tools: [UPDATE_PROFILE_TOOL],
  });

  const result: CoachResponse = { reply: extractText(followUp.content), profileUpdates };
  return Response.json(result);
}
