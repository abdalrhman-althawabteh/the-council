import { NextRequest, NextResponse } from "next/server";
import { db, hasDb } from "@/lib/supabase";
import { writeScript } from "@/lib/council";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { ideaId, lang = "en" } = (await req.json().catch(() => ({}))) as {
    ideaId?: string;
    lang?: "en" | "ar";
  };
  if (!ideaId || !hasDb()) {
    return NextResponse.json({ error: "ideaId required (and DB configured)" }, { status: 400 });
  }

  const { data: idea } = await db()
    .from("ideas")
    .select("id,title_seed,funnel,source_ref")
    .eq("id", ideaId)
    .single();
  if (!idea) return NextResponse.json({ error: "idea not found" }, { status: 404 });

  try {
    const s = await writeScript(idea, lang);
    const { data: row } = await db()
      .from("scripts")
      .insert({ idea_id: ideaId, title: s.title, hook: s.hook, script: s.script, lang })
      .select("*")
      .single();
    await db().from("ideas").update({ status: "scripted" }).eq("id", ideaId);
    return NextResponse.json({ ok: true, script: row });
  } catch (e) {
    console.error("[script]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
