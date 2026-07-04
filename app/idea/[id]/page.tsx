import { notFound } from "next/navigation";
import { db, hasDb } from "@/lib/supabase";
import { IdeaView } from "@/components/IdeaView";
import type { Idea, Verdict, ScriptRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasDb()) notFound();

  const [{ data: idea }, { data: session }, { data: script }] = await Promise.all([
    db().from("ideas").select("*").eq("id", id).single(),
    db().from("council_sessions").select("verdict").eq("idea_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db().from("scripts").select("*").eq("idea_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!idea) notFound();

  return (
    <IdeaView
      idea={idea as Idea}
      verdict={(session?.verdict as Verdict) ?? null}
      script={(script as ScriptRow) ?? null}
    />
  );
}
