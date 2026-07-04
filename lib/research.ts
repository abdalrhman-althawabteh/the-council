import { db, hasDb } from "./supabase";
import { search, statsFor, channelIdFromHandle, channelUploads, type YtVideo } from "./youtube";

// Market queries the scout sweeps across all of YouTube (non-competitor discovery).
const NICHE_QUERIES = [
  "build a business with Claude Code",
  "Claude Code tutorial for startups",
  "AI agents build SaaS",
  "make money with AI agents",
  "Claude Code automation business",
  "AI coding agent side hustle",
];

// Relevance gate — a video only counts if its title looks like Abood's niche
// (build a business with AI / Claude Code). Keeps competitor dumps on-topic.
const NICHE_RE =
  /\b(claude|gpt|llm|ai|a\.i|agent|agentic|automation|automate|n8n|make\.com|zapier|saas|startup|business|entrepreneur|revenue|profit|monet|gemini|antigravity|cursor|windsurf|replit|bolt|lovable|copilot|openai|anthropic|deepseek|grok|no.?code|workflow|chatbot|mcp|rag|opal|firebase|prompt|vibe.?cod|coding|code|build|app|api|tool)\b/i;

const PER_CHANNEL = 6; // most-recent relevant videos to keep per competitor

export interface ResearchResult {
  found: number;
  tracked: number;
  market: number;
  competitors: number;
}

const mapVideo = (v: YtVideo) => ({
  video_id: v.video_id,
  title: v.title,
  channel_title: v.channel_title,
  channel_id: v.channel_id,
  url: v.url,
  thumbnail: v.thumbnail,
  views: v.views ?? 0,
  published_at: v.published_at,
});

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

    // Tracked candidates: each competitor's recent uploads, newest-first, kept
    // per-competitor so we can relevance-filter and cap each channel.
    const trackedByComp = new Map<string, string[]>();
    const trackedIds = new Set<string>();
    for (const c of competitors) {
      try {
        const chId = await channelIdFromHandle(c);
        if (!chId) {
          console.warn("[research] could not resolve competitor:", c);
          continue;
        }
        const ids = await channelUploads(chId, 25);
        trackedByComp.set(c, ids);
        ids.forEach((id) => trackedIds.add(id));
      } catch (e) {
        console.warn("[research] competitor failed:", c, (e as Error).message);
      }
    }

    // Market candidates: niche keyword search (already relevance-ranked).
    const marketMeta = new Map<string, string>(); // videoId -> query
    for (const q of NICHE_QUERIES) {
      try {
        for (const v of await search(q, 8)) {
          if (!trackedIds.has(v.video_id) && !marketMeta.has(v.video_id)) {
            marketMeta.set(v.video_id, q);
          }
        }
      } catch (e) {
        console.warn("[research] query failed:", q, (e as Error).message);
      }
    }

    // Fetch stats (titles/views) for every candidate.
    const allIds = [...new Set([...trackedIds, ...marketMeta.keys()])];
    const stats: Record<string, YtVideo> = {};
    for (let i = 0; i < allIds.length; i += 50) {
      Object.assign(stats, await statsFor(allIds.slice(i, i + 50)));
    }

    const rows: any[] = [];

    // Tracked: per competitor, newest-first, niche-relevant only, capped.
    for (const [c, ids] of trackedByComp) {
      let kept = 0;
      for (const id of ids) {
        if (kept >= PER_CHANNEL) break;
        const v = stats[id];
        if (!v || !NICHE_RE.test(v.title)) continue;
        rows.push({ ...mapVideo(v), query: c, segment: "tracked" });
        kept++;
      }
    }

    // Market: keep the niche-search hits (already on-topic).
    for (const [id, q] of marketMeta) {
      const v = stats[id];
      if (!v) continue;
      rows.push({ ...mapVideo(v), query: q, segment: "market" });
    }

    // Fresh snapshot each run — clear the previous sweep so old/over-dumped rows
    // don't linger. (Saved ideas keep their own source_ref, so this is safe.)
    await db().from("competitor_videos").delete().not("id", "is", null);
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
