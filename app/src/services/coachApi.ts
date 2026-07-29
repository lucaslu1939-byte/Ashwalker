export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CoachResponse = {
  reply: string;
  profileUpdates: Record<string, string>;
};

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;

export async function sendCoachMessage(
  messages: ChatMessage[],
  profile: Record<string, string | null>
): Promise<CoachResponse> {
  if (!PROXY_URL) {
    throw new Error("EXPO_PUBLIC_PROXY_URL is not set. Add it to app/.env.");
  }

  const response = await fetch(`${PROXY_URL}/coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, profile }),
  });

  if (!response.ok) {
    throw new Error(`Coach request failed: ${response.status}`);
  }

  return response.json();
}
