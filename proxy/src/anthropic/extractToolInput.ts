import type Anthropic from "@anthropic-ai/sdk";

export function extractToolInput<T>(
  content: Anthropic.ContentBlock[],
  toolName: string
): T | null {
  const block = content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === toolName
  );
  if (!block || typeof block.input !== "object" || block.input === null) return null;
  return block.input as T;
}
