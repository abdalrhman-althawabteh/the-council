import { db, hasDb } from "@/lib/supabase";
import { ResearchFeed } from "@/components/ResearchFeed";
import type { CompetitorVideo, CommentInsight } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  let videos: CompetitorVideo[] = [];
  let insights: CommentInsight[] = [];
  if (hasDb()) {
    const [{ data: v }, { data: i }] = await Promise.all([
      db().from("competitor_videos").select("*").order("found_at", { ascending: false }).limit(40),
      db().from("comment_insights").select("*").order("weight", { ascending: false }).limit(12),
    ]);
    videos = (v as CompetitorVideo[]) ?? [];
    insights = (i as CommentInsight[]) ?? [];
  }
  return <ResearchFeed videos={videos} insights={insights} />;
}
