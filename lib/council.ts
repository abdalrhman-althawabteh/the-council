import { complete, completeJSON, MODEL_FAST, MODEL_SMART } from "./anthropic";
import { db, hasDb } from "./supabase";
import { videoDetails, transcriptFor, comments } from "./youtube";
import type { PersonaId, TranscriptTurn, Verdict } from "./types";

export interface Persona {
  id: PersonaId;
  name: string;
  nameAr: string;
  emoji: string;
  system: string;
}

const CHANNEL =
  "The channel belongs to Abood, a creator in the 'build a business with AI' niche, " +
  "currently focused on building businesses with Claude Code (the current trend). " +
  "His mission: open viewers' eyes that THEY can build a business with these tools, " +
  "and funnel them into his paid community. Ideas are graded by funnel stage: " +
  "TOF (top — broad reach, new eyes), MOF (middle — nurture, build trust/skills), " +
  "BOF (bottom — convert viewers into the community/customers).";

// The five advisors. Debate turns stay tight (2-4 sentences) so the room feels alive.
export const PERSONAS: Persona[] = [
  {
    id: "scout",
    name: "The Scout",
    nameAr: "الكشّاف",
    emoji: "🔭",
    system:
      `You are The Scout on a YouTube ideation council. ${CHANNEL} ` +
      "You spot opportunity: trends, gaps competitors miss, angles proven to travel. " +
      "Argue whether this idea has momentum and a fresh angle. Be concrete, cite the niche. 2-4 sentences.",
  },
  {
    id: "audience",
    name: "Audience Advocate",
    nameAr: "صوت الجمهور",
    emoji: "🗣️",
    system:
      `You are the Audience Advocate on a YouTube ideation council. ${CHANNEL} ` +
      "You represent what viewers actually want, based on their comments. " +
      "Argue whether this idea answers a real viewer desire or question. 2-4 sentences.",
  },
  {
    id: "funnel",
    name: "Funnel Strategist",
    nameAr: "استراتيجي القمع",
    emoji: "🎯",
    system:
      `You are the Funnel Strategist on a YouTube ideation council. ${CHANNEL} ` +
      "You judge funnel fit and MUST classify the idea as TOF, MOF, or BOF, and explain the path " +
      "from this video toward the community. 2-4 sentences.",
  },
  {
    id: "brand",
    name: "Brand-Fit Critic",
    nameAr: "ناقد الهوية",
    emoji: "🧭",
    system:
      `You are the Brand-Fit Critic on a YouTube ideation council. ${CHANNEL} ` +
      "You are skeptical. Argue whether this truly fits 'build a business with AI / Claude Code' and " +
      "the mission. Name the biggest weakness plainly. 2-4 sentences.",
  },
];

export const CHAIR: Persona = {
  id: "chair",
  name: "The Chair",
  nameAr: "رئيس المجلس",
  emoji: "⚖️",
  system:
    `You are the Chair of a YouTube ideation council. ${CHANNEL} ` +
    "You weigh the debate and deliver the final verdict.",
};

/** Pull recent research, comment insights, and channel signals into a context blob. */
export async function buildContext(): Promise<string> {
  if (!hasDb()) return "(No channel data connected yet — reason from the niche.)";
  const [research, insights, snaps] = await Promise.all([
    db().from("competitor_videos").select("title,views,channel_title").order("views", { ascending: false }).limit(12),
    db().from("comment_insights").select("theme,summary,sentiment,weight").order("weight", { ascending: false }).limit(8),
    db().from("channel_snapshots").select("title,views,avg_view_pct,ctr").order("views", { ascending: false }).limit(8),
  ]);
  const parts: string[] = [];
  if (research.data?.length) {
    parts.push(
      "TOP COMPETITOR/NICHE VIDEOS (title — views):\n" +
        research.data.map((r: any) => `- ${r.title} — ${r.views} (${r.channel_title})`).join("\n"),
    );
  }
  if (insights.data?.length) {
    parts.push(
      "WHAT VIEWERS WANT (comment themes):\n" +
        insights.data.map((i: any) => `- [${i.sentiment}] ${i.theme}: ${i.summary}`).join("\n"),
    );
  }
  if (snaps.data?.length) {
    parts.push(
      "OWN CHANNEL — top videos (views, retention%, CTR):\n" +
        snaps.data
          .map((s: any) => `- ${s.title} — ${s.views}v, ${s.avg_view_pct ?? "?"}%, CTR ${s.ctr ?? "?"}`)
          .join("\n"),
    );
  }
  return parts.join("\n\n") || "(No channel data yet — reason from the niche.)";
}

export type CouncilEvent =
  | { type: "turn"; turn: TranscriptTurn }
  | { type: "verdict"; verdict: Verdict }
  | { type: "error"; message: string };

const ROUNDS = 2; // ponytail: fixed at 2, bump if verdicts feel shallow

/** Runs the debate, yielding each turn as it lands, then the Chair's verdict. */
export async function* runCouncil(
  topic: string,
  context: string,
): AsyncGenerator<CouncilEvent> {
  const transcript: TranscriptTurn[] = [];
  const idea = topic?.trim() || "(open floor — propose the strongest idea for this channel)";

  for (let round = 1; round <= ROUNDS; round++) {
    for (const p of PERSONAS) {
      const prompt =
        `IDEA UNDER REVIEW: ${idea}\n\n` +
        `CHANNEL CONTEXT:\n${context}\n\n` +
        (transcript.length
          ? `DEBATE SO FAR:\n${transcript.map((t) => `${label(t.agent)}: ${t.text}`).join("\n")}\n\n`
          : "") +
        (round === 1
          ? "Open the debate with your take."
          : "This is round 2 — respond to the others, push back or build on them.");
      let text: string;
      try {
        text = await complete({ system: p.system, prompt, model: MODEL_FAST, maxTokens: 320 });
      } catch (e) {
        yield { type: "error", message: `${p.name} failed: ${(e as Error).message}` };
        return;
      }
      const turn: TranscriptTurn = { agent: p.id, round, text: text.trim() };
      transcript.push(turn);
      yield { type: "turn", turn };
    }
  }

  // Chair synthesizes → structured verdict
  try {
    const verdict = await completeJSON<Verdict>({
      system:
        CHAIR.system +
        " Return ONLY JSON: {score (0-100 int), funnel ('tof'|'mof'|'bof'), " +
        "strengths (3 short strings), weaknesses (2-3 short strings), " +
        "recommendation (one sentence: greenlight / revise / pass), title (a strong YouTube title)}.",
      prompt:
        `IDEA: ${idea}\n\nCONTEXT:\n${context}\n\nFULL DEBATE:\n` +
        transcript.map((t) => `${label(t.agent)}: ${t.text}`).join("\n"),
      model: MODEL_SMART,
      maxTokens: 900,
    });
    // guard the enum + shape
    if (!["tof", "mof", "bof"].includes(verdict.funnel)) verdict.funnel = "mof";
    verdict.score = Math.max(0, Math.min(100, Math.round(verdict.score)));
    verdict.strengths ??= [];
    verdict.weaknesses ??= [];
    yield { type: "verdict", verdict };
  } catch (e) {
    yield { type: "error", message: `Chair failed: ${(e as Error).message}` };
  }
}

function label(id: PersonaId): string {
  return [...PERSONAS, CHAIR].find((p) => p.id === id)?.name ?? id;
}

/** Persist a completed session + its idea. Returns the new idea id. */
export async function persistSession(
  topic: string,
  transcript: TranscriptTurn[],
  verdict: Verdict,
  sourceRef: string | null = null, // competitor video id when idea came from research
): Promise<string | null> {
  if (!hasDb()) return null;
  const { data: idea } = await db()
    .from("ideas")
    .insert({
      title_seed: verdict.title || topic || "Untitled idea",
      summary: verdict.recommendation,
      funnel: verdict.funnel,
      status: "proposed",
      score: verdict.score,
      source: sourceRef ? "research" : "council",
      source_ref: sourceRef,
    })
    .select("id")
    .single();
  await db().from("council_sessions").insert({
    idea_id: idea?.id ?? null,
    topic,
    transcript,
    verdict,
  });
  return idea?.id ?? null;
}

/**
 * Build reference material from the source competitor video so the script is
 * an ADAPTATION of it, not an invention. Transcript is best-effort; title +
 * description + comments always attempted. Never throws.
 */
async function referencePack(videoId: string): Promise<string | null> {
  try {
    const [details, transcript, cmts] = await Promise.all([
      videoDetails(videoId),
      transcriptFor(videoId), // ponytail: unofficial endpoint; null is normal
      comments(videoId, 20),
    ]);
    if (!details && !transcript) return null;
    const parts: string[] = [];
    if (details) {
      parts.push(`TITLE: ${details.title} (by ${details.channel})`);
      if (details.description) parts.push(`DESCRIPTION:\n${details.description.slice(0, 3000)}`);
    }
    if (transcript) parts.push(`TRANSCRIPT (what is actually said in the video):\n${transcript}`);
    if (cmts.length) parts.push(`TOP COMMENTS:\n${cmts.map((c) => `- ${c.slice(0, 200)}`).join("\n")}`);
    return parts.join("\n\n");
  } catch {
    return null;
  }
}

/** Generate a title + script for an approved idea. */
export async function writeScript(
  idea: { title_seed: string; funnel: string | null; source_ref?: string | null },
  lang: "en" | "ar",
): Promise<{ title: string; hook: string; script: string }> {
  const reference = idea.source_ref ? await referencePack(idea.source_ref) : null;

  const system =
    `You are a YouTube scriptwriter for Abood. ${CHANNEL} ` +
    `Write in ${lang === "ar" ? "Arabic" : "English"}. ` +
    (reference
      ? "You are ADAPTING an existing competitor video for Abood. Keep the SAME core structure, " +
        "flow, and key points as the reference video — but rewrite everything in Abood's voice: " +
        "his framing, his examples, his energy, and his CTA to his community. " +
        "It must feel like Abood's version of that video — not a copy, and never something unrelated. "
      : "") +
    "Return ONLY JSON: {title, hook (a 1-2 sentence opening hook), script (a full spoken-word " +
    "script with clear sections: Hook, Intro, Main points, CTA to the community)}.";

  return completeJSON<{ title: string; hook: string; script: string }>({
    system,
    prompt:
      `Idea: ${idea.title_seed}\nFunnel stage: ${idea.funnel ?? "mof"}` +
      (reference ? `\n\nREFERENCE VIDEO:\n${reference}` : ""),
    model: MODEL_SMART,
    maxTokens: 3000,
  });
}
