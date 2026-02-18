import { env } from "$env/dynamic/private";

const PROD_FALLBACK_TARGET = "https://pickleball-backend-production-150f.up.railway.app";

const normalizeTarget = (raw) => {
  const value = (raw || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, "");
  return `http://${value}`.replace(/\/+$/, "");
};

const makeHandler = (method) => async ({ params, request, url }) => {
  const configuredTarget = normalizeTarget(env.API_PROXY_TARGET);
  const isVercelRuntime = Boolean(env.VERCEL);
  const pointsToLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredTarget);
  const targetBase = isVercelRuntime && pointsToLocalhost
    ? PROD_FALLBACK_TARGET
    : configuredTarget;
  if (!targetBase) {
    return new Response(
      JSON.stringify({
        code: "PROXY_TARGET_MISSING",
        message: "API_PROXY_TARGET is not configured",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const path = params.path ?? "";
  const upstreamUrl = `${targetBase}/api/${path}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const init = {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
  };

  const upstreamResponse = await fetch(upstreamUrl, init);
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
};

export const GET = makeHandler("GET");
export const POST = makeHandler("POST");
export const PUT = makeHandler("PUT");
export const PATCH = makeHandler("PATCH");
export const DELETE = makeHandler("DELETE");
export const OPTIONS = makeHandler("OPTIONS");
