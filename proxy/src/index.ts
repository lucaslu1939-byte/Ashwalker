import { handleCoach } from "./routes/coach";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-App-Secret",
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return withCors(Response.json({ status: "ok" }));
    }

    if (url.pathname === "/coach" && request.method === "POST") {
      // Not a real security boundary — the secret ships inside the mobile app
      // bundle and can be extracted. It only deters random internet traffic
      // from running up the Anthropic bill.
      if (request.headers.get("X-App-Secret") !== env.APP_SHARED_SECRET) {
        return withCors(Response.json({ error: "Unauthorized" }, { status: 401 }));
      }
      return withCors(await handleCoach(request, env));
    }

    return withCors(new Response("Not found", { status: 404 }));
  },
} satisfies ExportedHandler<Env>;
