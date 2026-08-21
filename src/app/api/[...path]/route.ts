import { NextRequest, NextResponse } from "next/server";

const UPSTREAM =
  process.env.API_INTERNAL_URL ||
  (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8787" : "http://127.0.0.1:8787");

async function proxy(req: NextRequest, path: string[]) {
  const search = req.nextUrl.search;
  const url = `${UPSTREAM}/api/${path.join("/")}${search}`;
  const init: RequestInit = {
    method: req.method,
    headers: { "content-type": req.headers.get("content-type") || "application/json" },
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }
  try {
    const res = await fetch(url, init);
    let text = await res.text();
    let status = res.status;
    // Rewrite upstream 503 on read endpoints to 200 fail-open (never surface 503 to the user).
    if (status === 503) {
      const p = path.join("/");
      try { JSON.parse(text); } catch { /* ignore */ }
      if (p.includes("policies") && !p.includes("/")) { text = JSON.stringify({ policies: [], stale: true, reason: "rpc_unavailable" }); status = 200; }
      else if ((p.includes("claims") && !p.includes("/")) || p.includes("policies")) { text = JSON.stringify({ claims: [], policies: [], stale: true, reason: "rpc_unavailable" }); status = 200; }
      else if (p.includes("claims/") || p.includes("policies/")) { text = JSON.stringify({ error: "not_found", stale: true, reason: "rpc_unavailable" }); status = 200; }
      else if (p.includes("stats")) { text = JSON.stringify({ total_policies: 0, total_claims: 0, premium_pool: 0, approved_claims: 0, rejected_claims: 0, stale: true, reason: "rpc_unavailable" }); status = 200; }
      else if (p === "read") { try { const prev = JSON.parse(text); text = JSON.stringify({ result: prev.result ?? [], stale: true, reason: "rpc_unavailable" }); } catch { text = JSON.stringify({ result: [], stale: true, reason: "rpc_unavailable" }); } status = 200; }
      else { text = JSON.stringify({ stale: true, reason: "rpc_unavailable" }); status = 200; }
    }
    return new NextResponse(text, {
      status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
        "x-ratelimit-limit": res.headers.get("x-ratelimit-limit") || "100",
        "x-ratelimit-remaining": res.headers.get("x-ratelimit-remaining") || "99",
        "x-ratelimit-reset": res.headers.get("x-ratelimit-reset") || "0",
      },
    });
  } catch {
    // Fail-open: upstream unreachable. Return empty data so the page shows
    // "live data unavailable" instead of a red error. Never 503 on reads.
    const p = path.join("/");
    if (p.includes("policies")) return NextResponse.json({ policies: [], stale: true, reason: "rpc_unavailable" }, { status: 200 });
    if (p.includes("claims") && !p.includes("/")) {
      // /api/claims?address=…  (list)
      return NextResponse.json({ claims: [], stale: true, reason: "rpc_unavailable" }, { status: 200 });
    }
    if (p === "stats" || p.includes("stats")) {
      return NextResponse.json({ total_policies: 0, total_claims: 0, premium_pool: 0, approved_claims: 0, rejected_claims: 0, stale: true, reason: "rpc_unavailable" }, { status: 200 });
    }
    if (p === "read") return NextResponse.json({ result: [], stale: true, reason: "rpc_unavailable" }, { status: 200 });
    // Generic read fallback (claims/{id}, policies/{id}, claim?id=…)
    return NextResponse.json({ error: "not_found", stale: true, reason: "rpc_unavailable" }, { status: 200 });
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: { path: string[] } },
) {
  return proxy(req, ctx.params.path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: { path: string[] } },
) {
  return proxy(req, ctx.params.path);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
