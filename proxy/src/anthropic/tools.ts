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

const DAY_PLAN_PROPERTIES = {
  dayNumber: { type: "integer", minimum: 1, maximum: 7 },
  breakfast: { type: "string" },
  lunch: { type: "string" },
  dinner: { type: "string" },
  snack: { type: "string" },
  movement: { type: "string" },
  meditation: { type: "string" },
  frequencyHealing: { type: "string" },
} as const;

export const GENERATE_WEEKLY_PLAN_TOOL: Anthropic.Tool = {
  name: "generate_weekly_plan",
  description:
    "Return the complete 7-day wellness plan as structured data. Every day must have all fields " +
    "filled in, and no breakfast/lunch/dinner recipe may repeat across the 7 days (snacks may " +
    "repeat). Detail level (how specific each recipe is) should still adapt to the user's diet " +
    "experience, but every day needs a value in every field regardless of experience level.",
  input_schema: {
    type: "object",
    properties: {
      introNote: {
        type: "string",
        description: "One short warm sentence introducing the week, tied to the user's goal.",
      },
      days: {
        type: "array",
        minItems: 7,
        maxItems: 7,
        items: {
          type: "object",
          properties: DAY_PLAN_PROPERTIES,
          required: [
            "dayNumber",
            "breakfast",
            "lunch",
            "dinner",
            "snack",
            "movement",
            "meditation",
            "frequencyHealing",
          ],
        },
      },
    },
    required: ["introNote", "days"],
  },
};

export const SWAP_RECIPE_TOOL: Anthropic.Tool = {
  name: "swap_recipe",
  description: "Return one replacement recipe for the requested meal slot.",
  input_schema: {
    type: "object",
    properties: {
      recipe: { type: "string" },
    },
    required: ["recipe"],
  },
};

export const GENERATE_GROCERY_LIST_TOOL: Anthropic.Tool = {
  name: "generate_grocery_list",
  description:
    "Return a shopping list derived from the given week's recipes, grouped into shopping " +
    "categories (e.g. Produce, Proteins, Pantry, Dairy/Alternatives). Combine duplicate " +
    "ingredients across the week into one line rather than repeating them per day.",
  input_schema: {
    type: "object",
    properties: {
      categories: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            items: { type: "array", items: { type: "string" } },
          },
          required: ["name", "items"],
        },
      },
    },
    required: ["categories"],
  },
};
