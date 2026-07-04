import { NextRequest, NextResponse } from "next/server";
import { db, hasDb } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "no db" }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as {
    research_hour?: number;
    competitors?: string[];
    default_lang?: "en" | "ar";
  };
  const patch: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };
  if (body.research_hour != null) patch.research_hour = body.research_hour;
  if (body.competitors) patch.competitors = body.competitors;
  if (body.default_lang) patch.default_lang = body.default_lang;
  const { error } = await db().from("app_settings").upsert(patch);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
