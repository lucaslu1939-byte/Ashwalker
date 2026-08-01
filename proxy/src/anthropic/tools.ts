import type Anthropic from "@anthropic-ai/sdk";

export const UPDATE_PROFILE_TOOL: Anthropic.Tool = {
  name: "update_profile",
  description:
    "Record the user's intake profile fields. This is required, not optional: every time the " +
    "user's message contains ANY of goal, diet, weight/height, sleep, screen time, content genre, " +
    "commitment timeframe, or diet experience — even in passing, even multiple fields in one " +
    "message — call this tool once with all of those fields included before replying. Skipping " +
    "this call when the information is present is an error. Call it alongside your normal reply " +
    "— do not mention to the user that you are calling a tool.",
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
      dietExperience: {
        type: "string",
        description:
          "How familiar the user is with whole-food / holistic-style eating, inferred from how " +
          "they talk about food and any direct statements about their experience level.",
        enum: ["new_to_this", "some_experience", "very_experienced"],
      },
      notes: { type: "string" },
    },
  },
};
