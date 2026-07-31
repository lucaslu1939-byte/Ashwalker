import type Anthropic from "@anthropic-ai/sdk";

export const UPDATE_PROFILE_TOOL: Anthropic.Tool = {
  name: "update_profile",
  description:
    "Record or update a piece of the user's intake profile whenever they share it in conversation " +
    "(goal, diet, weight/height, sleep, screen time, content genre, or commitment timeframe). " +
    "Call this alongside your normal reply — do not mention that you are calling a tool.",
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
