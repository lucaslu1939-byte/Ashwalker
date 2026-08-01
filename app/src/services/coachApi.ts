import type { ChatMessage } from "../data/types";

export type { ChatMessage };

export type CoachResponse = {
  reply: string;
  profileUpdates: Record<string, string>;
};

export type DietPlanResponse = {
  plan: string;
};

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;
const APP_SECRET = process.env.EXPO_PUBLIC_APP_SECRET;

async function postToProxy<T>(path: string, body: unknown, label: string): Promise<T> {
  if (!PROXY_URL) {
    throw new Error("EXPO_PUBLIC_PROXY_URL is not set. Add it to app/.env.");
  }

  const response = await fetch(`${PROXY_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(APP_SECRET ? { "X-App-Secret": APP_SECRET } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? `Couldn't connect to your coach (unauthorized). Check EXPO_PUBLIC_APP_SECRET in app/.env.`
        : `${label} request failed: ${response.status}`
    );
  }

  return response.json();
}

export async function sendCoachMessage(
  messages: ChatMessage[],
  profile: Record<string, string | null>
): Promise<CoachResponse> {
  return postToProxy<CoachResponse>("/coach", { messages, profile }, "Coach");
}

export async function generateDietPlan(
  profile: Record<string, string | null>
): Promise<DietPlanResponse> {
  return postToProxy<DietPlanResponse>("/diet-plan", { profile }, "Diet plan");
}
