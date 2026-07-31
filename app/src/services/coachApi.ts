import type { ChatMessage } from "../data/types";

export type { ChatMessage };

export type CoachResponse = {
  reply: string;
  profileUpdates: Record<string, string>;
};

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;
const APP_SECRET = process.env.EXPO_PUBLIC_APP_SECRET;

export async function sendCoachMessage(
  messages: ChatMessage[],
  profile: Record<string, string | null>
): Promise<CoachResponse> {
  if (!PROXY_URL) {
    throw new Error("EXPO_PUBLIC_PROXY_URL is not set. Add it to app/.env.");
  }

  const response = await fetch(`${PROXY_URL}/coach`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(APP_SECRET ? { "X-App-Secret": APP_SECRET } : {}),
    },
    body: JSON.stringify({ messages, profile }),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Couldn't connect to your coach (unauthorized). Check EXPO_PUBLIC_APP_SECRET in app/.env."
        : `Coach request failed: ${response.status}`
    );
  }

  return response.json();
}
