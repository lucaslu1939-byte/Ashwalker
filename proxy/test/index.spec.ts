import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

const AUTHENTICATED_ROUTES: { path: string; body: unknown }[] = [
	{ path: "/coach", body: { messages: [], profile: {} } },
	{ path: "/diet-plan", body: { profile: {} } },
	{ path: "/weekly-plan", body: { profile: {} } },
	{ path: "/swap-recipe", body: { mealType: "breakfast", avoidRecipes: [] } },
	{ path: "/grocery-list", body: { days: [] } },
];

describe("proxy worker", () => {
	it("responds to /health with ok status (unit style)", async () => {
		const request = new IncomingRequest("http://example.com/health");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(await response.json()).toEqual({ status: "ok" });
	});

	it("responds to /health with ok status (integration style)", async () => {
		const response = await SELF.fetch("https://example.com/health");
		expect(await response.json()).toEqual({ status: "ok" });
	});

	it("returns 404 for unknown routes", async () => {
		const response = await SELF.fetch("https://example.com/unknown");
		expect(response.status).toBe(404);
	});

	for (const { path, body } of AUTHENTICATED_ROUTES) {
		it(`rejects ${path} requests missing the app secret header`, async () => {
			const response = await SELF.fetch(`https://example.com${path}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			expect(response.status).toBe(401);
		});

		it(`rejects ${path} requests with the wrong app secret header`, async () => {
			const response = await SELF.fetch(`https://example.com${path}`, {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-App-Secret": "wrong" },
				body: JSON.stringify(body),
			});
			expect(response.status).toBe(401);
		});
	}

	it("returns 400 (not a crash) for /coach when the JSON body is a literal null", async () => {
		const response = await SELF.fetch("https://example.com/coach", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-App-Secret": env.APP_SHARED_SECRET },
			body: "null",
		});
		expect(response.status).toBe(400);
	});

	it("rejects /swap-recipe with an invalid mealType (authenticated)", async () => {
		const response = await SELF.fetch("https://example.com/swap-recipe", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-App-Secret": env.APP_SHARED_SECRET },
			body: JSON.stringify({ mealType: "dessert" }),
		});
		expect(response.status).toBe(400);
	});

	it("rejects /grocery-list with no days (authenticated)", async () => {
		const response = await SELF.fetch("https://example.com/grocery-list", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-App-Secret": env.APP_SHARED_SECRET },
			body: JSON.stringify({ days: [] }),
		});
		expect(response.status).toBe(400);
	});

	it("rejects /grocery-list with more than 7 days (authenticated)", async () => {
		const tooManyDays = Array.from({ length: 8 }, (_, i) => ({
			dayNumber: i + 1,
			breakfast: "x",
			lunch: "x",
			dinner: "x",
		}));
		const response = await SELF.fetch("https://example.com/grocery-list", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-App-Secret": env.APP_SHARED_SECRET },
			body: JSON.stringify({ days: tooManyDays }),
		});
		expect(response.status).toBe(400);
	});
});
