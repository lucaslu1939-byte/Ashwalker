import type Anthropic from "@anthropic-ai/sdk";

export const UPDATE_PROFILE_TOOL: Anthropic.Tool = {
  name: "update_profile",
  description:
    "Record the user's intake profile fields. This is required, not optional: every time the " +
    "user's message contains ANY of goal, diet, weight/height, sleep, screen time, content genre, " +
    "or commitment timeframe — even in passing, even multiple fields in one message — call this " +
    "tool once with all of those fields included before replying. Skipping this call when the " +
    "information is present is an error. Call it alongside your normal reply — do not mention to " +
    "the user that you are calling a tool.",
  input_schema: {
    type: "object",
    properties: {
      goal: { type: "string" },
      diet: { type: "string" },
      weightHeight: { type: "string" },
      sleep: { type: "string" },
      screenTime: { type: "string" },
      contentGenre: { type: "string" },
      commitmentTimeframe: {
        type: "string",
        enum: ["7", "14", "30", "not_sure"],
      },
      notes: { type: "string" },
    },
  },
};
