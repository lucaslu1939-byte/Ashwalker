export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type DayPlan = {
  dayNumber: number;
  celeryJuice: string;
  heavyMetalDetoxSmoothie: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  movement: string;
  meditation: string;
  frequencyHealing: string;
};

export type RecipeDetail = {
  ingredients: string[];
  instructions: string[];
};

export type MealType = "breakfast" | "lunch" | "dinner";

export type GroceryCategory = {
  name: string;
  items: string[];
};

export type WeeklyPlan = {
  weekStartDate: string;
  introNote: string;
  days: DayPlan[];
  groceryList: GroceryCategory[] | null;
};
