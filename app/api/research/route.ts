import { NextRequest, NextResponse } from "next/server";
import { hasDb } from "@/lib/supabase";
import { runResearch } from "@/lib/research";

export const runtime = "nodejs";
export const maxDuration = 60;

function cronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured → allow (dev)
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}` || req.nextUrl.searchParams.get("key") === secret;
}

// GET = daily Vercel cron (guarded by CRON_SECRET).
export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return run();
}

// POST = manual "Run research now" from the UI. ponytail: single-user app with no
// auth — matches the existing open posture; gate behind auth if it goes multi-user.
export async function POST() {
  return run();
}

async function run() {
  if (!hasDb()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  }
  try {
    const result = await runResearch();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[research]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
