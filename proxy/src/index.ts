import { handleCoach } from "./routes/coach";
import { handleDietPlan } from "./routes/dietPlan";

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

// Not a real security boundary — the secret ships inside the mobile app
// bundle and can be extracted. It only deters random internet traffic from
// running up the Anthropic bill.
function isAuthorized(request: Request, env: Env): boolean {
  return request.headers.get("X-App-Secret") === env.APP_SHARED_SECRET;
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
      if (!isAuthorized(request, env)) {
        return withCors(Response.json({ error: "Unauthorized" }, { status: 401 }));
      }
      return withCors(await handleCoach(request, env));
    }

    if (url.pathname === "/diet-plan" && request.method === "POST") {
      if (!isAuthorized(request, env)) {
        return withCors(Response.json({ error: "Unauthorized" }, { status: 401 }));
      }
      return withCors(await handleDietPlan(request, env));
    }

    return withCors(new Response("Not found", { status: 404 }));
  },
} satisfies ExportedHandler<Env>;
