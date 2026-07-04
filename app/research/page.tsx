import { db, hasDb } from "@/lib/supabase";
import { ResearchFeed } from "@/components/ResearchFeed";
import type { CompetitorVideo } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  let tracked: CompetitorVideo[] = [];
  let market: CompetitorVideo[] = [];
  if (hasDb()) {
    // fetch each segment separately so neither gets truncated by the other
    const [{ data: t }, { data: m }] = await Promise.all([
      db().from("competitor_videos").select("*").eq("segment", "tracked").order("published_at", { ascending: false }).limit(60),
      db().from("competitor_videos").select("*").eq("segment", "market").order("views", { ascending: false }).limit(40),
    ]);
    tracked = (t as CompetitorVideo[]) ?? [];
    market = (m as CompetitorVideo[]) ?? [];
  }
  return <ResearchFeed tracked={tracked} market={market} />;
}
