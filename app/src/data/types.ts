export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type DayPlan = {
  dayNumber: number;
  morningRoutine: string;
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

export type BookSource = {
  id: number;
  title: string;
  sourceText: string;
  charCount: number;
  createdAt: string;
};

export type JournalEntry = {
  entryDate: string;
  mood: number;
  energy: number;
  didMorningRoutine: boolean;
  didMeals: boolean;
  didMovement: boolean;
  didMeditation: boolean;
  notes: string | null;
  updatedAt: string;
};
