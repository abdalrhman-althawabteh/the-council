import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import {
  channelUploads,
  statsFor,
  comments,
  privateAnalytics,
  type PrivateMetrics,
} from "@/lib/youtube";
import { completeJSON } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) {
    return NextResponse.json({ error: "YOUTUBE_CHANNEL_ID not set" }, { status: 400 });
  }

  try {
    // 1) Public: own uploads + stats
    const ids = await channelUploads(channelId, 25);
    const stats = await statsFor(ids);

    // 2) Private: retention / CTR (non-fatal if not connected)
    let priv: Record<string, PrivateMetrics> = {};
    let privateOk = false;
    try {
      priv = await privateAnalytics();
      privateOk = true;
    } catch (e) {
      console.warn("[sync] private analytics skipped:", (e as Error).message);
    }

    const rows = Object.values(stats).map((v) => ({
      video_id: v.video_id,
      title: v.title,
      published_at: v.published_at,
      thumbnail: v.thumbnail,
      views: v.views ?? 0,
      likes: v.likes ?? 0,
      comments: v.comments ?? 0,
      avg_view_pct: priv[v.video_id]?.avg_view_pct ?? null,
      avg_view_sec: priv[v.video_id]?.avg_view_sec ?? null,
      synced_at: new Date().toISOString(),
    }));
    if (rows.length) await db().from("channel_snapshots").upsert(rows);

    // 3) Comment themes from the top videos → summarized insights (his channel)
    const top = Object.values(stats)
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      .slice(0, 8);
    const pooled: string[] = [];
    for (const v of top) pooled.push(...(await comments(v.video_id, 30)));

    let insightCount = 0;
    if (pooled.length >= 3) {
      const insights = await summarizeComments(pooled.slice(0, 80));
      // sanitize to known columns only — the model sometimes adds extra keys,
      // which makes the whole batch insert fail.
      const rows = insights
        .filter((x) => x?.theme && x?.summary)
        .map((x) => ({
          theme: String(x.theme),
          summary: String(x.summary),
          sample: x.sample ? String(x.sample) : null,
          weight: Number(x.weight) || 1,
        }));
      if (rows.length) {
        await db().from("comment_insights").delete().not("id", "is", null); // refresh all
        const { error: insErr } = await db().from("comment_insights").insert(rows);
        if (insErr) console.warn("[sync] insight insert failed:", insErr.message);
        else insightCount = rows.length;
      }
    }

    return NextResponse.json({
      ok: true,
      videos: rows.length,
      privateAnalytics: privateOk,
      insights: insightCount,
    });
  } catch (e) {
    console.error("[sync]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

async function summarizeComments(all: string[]) {
  // Turn comments into concrete VIDEO IDEAS (what the audience is asking for),
  // not sentiment summaries — the creator can already read raw comments in Studio.
  const system =
    "You turn a creator's YouTube comments into their NEXT VIDEO IDEAS. Niche: " +
    "'build a business with AI / Claude Code'. Read the comments and extract the " +
    "5-7 strongest, most specific video ideas the audience is explicitly or " +
    "implicitly asking for (questions they keep asking, tools they want covered, " +
    "confusions to clear up, requests to go deeper/slower). Each must be a concrete, " +
    "clickable video concept — not a feeling. Respond ONLY with a JSON array of objects: " +
    "{theme (the video idea, phrased as a specific topic/angle), summary (the demand " +
    "signal — what in the comments shows people want this), sample (one representative " +
    "comment, verbatim), weight (int 1-10 = how strong the demand is)}. Leave sentiment out.";
  try {
    return await completeJSON<
      { theme: string; summary: string; sample: string; weight: number }[]
    >({
      system,
      prompt: `Comments:\n${all.map((c) => `- ${c.replace(/\n/g, " ")}`).join("\n")}`,
      maxTokens: 3000, // Arabic comments are token-heavy; small caps truncated the JSON
    });
  } catch (e) {
    console.warn("[sync] comment summarize failed:", (e as Error).message);
    return [];
  }
}
