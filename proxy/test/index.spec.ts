import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

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

	it("rejects /coach requests missing the app secret header", async () => {
		const response = await SELF.fetch("https://example.com/coach", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ messages: [], profile: {} }),
		});
		expect(response.status).toBe(401);
	});

	it("rejects /coach requests with the wrong app secret header", async () => {
		const response = await SELF.fetch("https://example.com/coach", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-App-Secret": "wrong" },
			body: JSON.stringify({ messages: [], profile: {} }),
		});
		expect(response.status).toBe(401);
	});

	it("rejects /diet-plan requests missing the app secret header", async () => {
		const response = await SELF.fetch("https://example.com/diet-plan", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ profile: {} }),
		});
		expect(response.status).toBe(401);
	});

	it("rejects /diet-plan requests with the wrong app secret header", async () => {
		const response = await SELF.fetch("https://example.com/diet-plan", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-App-Secret": "wrong" },
			body: JSON.stringify({ profile: {} }),
		});
		expect(response.status).toBe(401);
	});

	it("returns 400 (not a crash) for /coach when the JSON body is a literal null", async () => {
		const response = await SELF.fetch("https://example.com/coach", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-App-Secret": env.APP_SHARED_SECRET },
			body: "null",
		});
		expect(response.status).toBe(400);
	});
});
