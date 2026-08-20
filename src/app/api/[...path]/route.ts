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
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
        "x-ratelimit-limit": res.headers.get("x-ratelimit-limit") || "100",
        "x-ratelimit-remaining": res.headers.get("x-ratelimit-remaining") || "99",
        "x-ratelimit-reset": res.headers.get("x-ratelimit-reset") || "0",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "rpc_unavailable: upstream API not reachable" },
      { status: 503 },
    );
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
