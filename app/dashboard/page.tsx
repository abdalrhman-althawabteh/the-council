import { db, hasDb } from "@/lib/supabase";
import { DashboardView, type Health } from "@/components/DashboardView";
import type { Idea } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let ideas: Idea[] = [];
  let health: Health = {
    videos: 0,
    totalViews: 0,
    avgRetention: null,
    topTitle: null,
    connected: false,
  };

  if (hasDb()) {
    const [{ data: ideaRows }, { data: snaps }, { data: tok }] = await Promise.all([
      db().from("ideas").select("*").order("created_at", { ascending: false }).limit(60),
      db().from("channel_snapshots").select("title,views,avg_view_pct").order("views", { ascending: false }),
      db().from("oauth_tokens").select("id").eq("id", 1).maybeSingle(),
    ]);
    ideas = (ideaRows as Idea[]) ?? [];
    const s = snaps ?? [];
    const retentions = s.map((r: any) => r.avg_view_pct).filter((v: any) => v != null);
    health = {
      videos: s.length,
      totalViews: s.reduce((a: number, r: any) => a + (r.views ?? 0), 0),
      avgRetention: retentions.length
        ? retentions.reduce((a: number, b: number) => a + b, 0) / retentions.length
        : null,
      topTitle: s[0]?.title ?? null,
      connected: Boolean(tok),
    };
  }

  return <DashboardView ideas={ideas} health={health} />;
}
