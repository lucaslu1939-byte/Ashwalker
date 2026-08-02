import { handleCoach } from "./routes/coach";
import { handleDietPlan } from "./routes/dietPlan";
import { handleWeeklyPlan } from "./routes/weeklyPlan";
import { handleSwapRecipe } from "./routes/swapRecipe";
import { handleGroceryList } from "./routes/groceryList";
import { handleRecipeDetail } from "./routes/recipeDetail";

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

type RouteHandler = (request: Request, env: Env) => Promise<Response>;

const AUTHENTICATED_ROUTES: Record<string, RouteHandler> = {
  "/coach": handleCoach,
  "/diet-plan": handleDietPlan,
  "/weekly-plan": handleWeeklyPlan,
  "/swap-recipe": handleSwapRecipe,
  "/grocery-list": handleGroceryList,
  "/recipe-detail": handleRecipeDetail,
};

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return withCors(Response.json({ status: "ok" }));
    }

    if (request.method === "POST" && url.pathname in AUTHENTICATED_ROUTES) {
      if (!isAuthorized(request, env)) {
        return withCors(Response.json({ error: "Unauthorized" }, { status: 401 }));
      }
      return withCors(await AUTHENTICATED_ROUTES[url.pathname](request, env));
    }

    return withCors(new Response("Not found", { status: 404 }));
  },
} satisfies ExportedHandler<Env>;
