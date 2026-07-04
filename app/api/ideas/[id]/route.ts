import { NextRequest, NextResponse } from "next/server";
import { db, hasDb } from "@/lib/supabase";

export const runtime = "nodejs";

// Delete an idea. scripts cascade (FK on delete cascade); council_sessions keep
// their transcript with idea_id nulled (FK on delete set null). ponytail:
// single-user app, no auth — matches the existing open posture.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasDb()) return NextResponse.json({ error: "no db" }, { status: 400 });
  const { error } = await db().from("ideas").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
