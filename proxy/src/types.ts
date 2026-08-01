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
