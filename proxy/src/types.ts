export {};

declare global {
  interface Env {
    ANTHROPIC_API_KEY: string;
    APP_SHARED_SECRET: string;
  }
}

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CoachRequest = {
  messages: ChatMessage[];
  profile?: Record<string, string | null>;
};

export type CoachResponse = {
  reply: string;
  profileUpdates: Record<string, string>;
};

export type DietPlanRequest = {
  profile?: Record<string, string | null>;
};

export type DietPlanResponse = {
  plan: string;
};

export type DayPlan = {
  dayNumber: number;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  movement: string;
  meditation: string;
  frequencyHealing: string;
};

export type WeeklyPlanRequest = {
  profile?: Record<string, string | null>;
};

export type WeeklyPlanResponse = {
  introNote: string;
  days: DayPlan[];
};

export type MealType = "breakfast" | "lunch" | "dinner";

export type SwapRecipeRequest = {
  profile?: Record<string, string | null>;
  mealType?: MealType;
  avoidRecipes?: string[];
};

export type SwapRecipeResponse = {
  recipe: string;
};

export type GroceryCategory = {
  name: string;
  items: string[];
};

export type GroceryListRequest = {
  days?: DayPlan[];
};

export type GroceryListResponse = {
  categories: GroceryCategory[];
};
