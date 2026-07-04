import { db, hasDb } from "./supabase";
import { search, statsFor, channelIdFromHandle, channelUploads } from "./youtube";

// Niche queries the scout sweeps. Tracked competitors from settings are searched
// per-channel (their latest uploads) and tagged 'tracked'.
const NICHE_QUERIES = [
  "build a business with Claude Code",
  "Claude Code tutorial for startups",
  "AI agents build SaaS",
  "make money with AI agents",
  "Claude Code automation business",
  "AI coding agent side hustle",
];

export interface ResearchResult {
  found: number;
  tracked: number;
  market: number;
  competitors: number;
}

/** Sweep competitor + niche videos into competitor_videos. Used by cron + manual trigger. */
export async function runResearch(): Promise<ResearchResult> {
  if (!hasDb()) throw new Error("Supabase not configured");

  const run = await db().from("research_runs").insert({}).select("id").single();
  const runId = run.data?.id;

  try {
    const { data: settings } = await db()
      .from("app_settings")
      .select("competitors")
      .eq("id", 1)
      .single();
    const competitors = ((settings?.competitors as string[]) ?? []).filter(Boolean);

    // Collect unique video ids with query + segment. Tracked first so it wins
    // the segment when a video also shows up in market search.
    const byId = new Map<string, { query: string; segment: "tracked" | "market" }>();

    // Tracked competitors: newest uploads via each channel's uploads playlist
    // (reliable + cheap; the Search API with an empty query silently dropped
    // most channels).
    for (const c of competitors) {
      try {
        const chId = await channelIdFromHandle(c);
        if (!chId) {
          console.warn("[research] could not resolve competitor:", c);
          continue;
        }
        for (const vid of await channelUploads(chId, 15)) {
          if (!byId.has(vid)) byId.set(vid, { query: c, segment: "tracked" });
        }
      } catch (e) {
        console.warn("[research] competitor failed:", c, (e as Error).message);
      }
    }

    for (const q of NICHE_QUERIES) {
      try {
        for (const v of await search(q, 8)) {
          if (!byId.has(v.video_id)) byId.set(v.video_id, { query: q, segment: "market" });
        }
      } catch (e) {
        console.warn("[research] query failed:", q, (e as Error).message);
      }
    }

    const ids = [...byId.keys()];
    const rows: any[] = [];
    for (let i = 0; i < ids.length; i += 50) {
      const stats = await statsFor(ids.slice(i, i + 50));
      for (const v of Object.values(stats)) {
        const meta = byId.get(v.video_id);
        rows.push({
          video_id: v.video_id,
          title: v.title,
          channel_title: v.channel_title,
          channel_id: v.channel_id,
          url: v.url,
          thumbnail: v.thumbnail,
          views: v.views ?? 0,
          published_at: v.published_at,
          query: meta?.query,
          segment: meta?.segment ?? "market",
        });
      }
    }
    if (rows.length) {
      await db().from("competitor_videos").upsert(rows, { onConflict: "video_id" });
    }

    if (runId) {
      await db()
        .from("research_runs")
        .update({ finished_at: new Date().toISOString(), found_count: rows.length })
        .eq("id", runId);
    }
    const tracked = rows.filter((r) => r.segment === "tracked").length;
    return { found: rows.length, tracked, market: rows.length - tracked, competitors: competitors.length };
  } catch (e) {
    if (runId) {
      await db()
        .from("research_runs")
        .update({ finished_at: new Date().toISOString(), error: (e as Error).message })
        .eq("id", runId);
    }
    throw e;
  }
}
