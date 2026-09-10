const corsHeaders = (origin, allowedOrigin) => ({
  "Access-Control-Allow-Origin":
    origin === allowedOrigin ? origin : allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
});

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin, env.ALLOWED_ORIGIN);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    try {
      const response = await fetch(env.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: await request.text(),
      });
      return new Response(await response.text(), {
        status: response.ok ? 200 : response.status,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ ok: false, error: "Backend unavailable" }),
        {
          status: 502,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }
  },
};
