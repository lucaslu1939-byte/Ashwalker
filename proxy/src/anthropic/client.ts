import Anthropic from "@anthropic-ai/sdk";

export const COACH_MODEL = "claude-sonnet-5";

export function createAnthropicClient(env: Env): Anthropic {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}
