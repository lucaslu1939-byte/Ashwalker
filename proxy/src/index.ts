import { handleCoach } from "./routes/coach";

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    if (url.pathname === "/coach" && request.method === "POST") {
      return handleCoach(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
