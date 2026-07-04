import { NextRequest } from "next/server";
import { buildContext, runCouncil, persistSession } from "@/lib/council";
import type { TranscriptTurn, Verdict } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

// Streams the debate to the client as Server-Sent Events. Each event is a JSON
// line: {type:'turn'|'verdict'|'done'|'error', ...}.
export async function POST(req: NextRequest) {
  const { topic = "", ref = null } = (await req.json().catch(() => ({}))) as {
    topic?: string;
    ref?: string | null;
  };

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

      const transcript: TranscriptTurn[] = [];
      let verdict: Verdict | null = null;
      try {
        let context = await buildContext();
        if (ref) {
          context += `\n\nSOURCE VIDEO: this idea is based on an existing competitor video (id ${ref}, title: "${topic}") — judge it as Abood's own adaptation of that video.`;
        }
        for await (const ev of runCouncil(topic, context)) {
          if (ev.type === "turn") transcript.push(ev.turn);
          if (ev.type === "verdict") verdict = ev.verdict;
          send(ev);
        }
        let ideaId: string | null = null;
        if (verdict) ideaId = await persistSession(topic, transcript, verdict, ref);
        send({ type: "done", ideaId });
      } catch (e) {
        send({ type: "error", message: (e as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
