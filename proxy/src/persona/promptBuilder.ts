import { SAFETY_INSTRUCTIONS } from "./safety";
import { PHILOSOPHY_PERSONA } from "./philosophy";

function renderProfileContext(profile: Record<string, string | null>): string {
  const knownFields = Object.entries(profile).filter(([, value]) => value);
  if (knownFields.length === 0) {
    return "Known so far about the user: nothing yet — this is the start of the conversation.";
  }
  const summary = knownFields.map(([key, value]) => `${key}=${value}`).join("; ");
  return `Known so far about the user: ${summary}`;
}

export function buildSystemPrompt(profile: Record<string, string | null>): string {
  return [SAFETY_INSTRUCTIONS, PHILOSOPHY_PERSONA, renderProfileContext(profile)].join("\n\n");
}
