"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PERSONA_META } from "./personas";
import { VerdictPanel } from "./VerdictPanel";
import { GenerateScriptButton } from "./GenerateScriptButton";
import type { TranscriptTurn, Verdict, PersonaId } from "@/lib/types";

type Phase = "idle" | "running" | "done";

export function CouncilRoom() {
  const { t, lang } = useI18n();
  const params = useSearchParams();
  const [topic, setTopic] = useState(params.get("topic") ?? "");
  const refVideoId = params.get("ref"); // source video when idea came from research
  const [phase, setPhase] = useState<Phase>("idle");
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [thinking, setThinking] = useState<PersonaId | null>("scout");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const order: PersonaId[] = ["scout", "audience", "funnel", "brand"];

  async function convene() {
    setPhase("running");
    setTurns([]);
    setVerdict(null);
    setIdeaId(null);
    setError(null);
    setThinking("scout");

    try {
      const res = await fetch("/api/council/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, ref: refVideoId }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.replace(/^data: /, "").trim();
          if (!line) continue;
          const ev = JSON.parse(line);
          if (ev.type === "turn") {
            setTurns((prev) => {
              const next = [...prev, ev.turn as TranscriptTurn];
              // whoever speaks next is "thinking"
              const spoken = ev.turn.agent as PersonaId;
              const i = order.indexOf(spoken);
              setThinking(order[(i + 1) % order.length]);
              return next;
            });
            queueMicrotask(() =>
              scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }),
            );
          } else if (ev.type === "verdict") {
            setThinking("chair");
            setVerdict(ev.verdict as Verdict);
          } else if (ev.type === "done") {
            setIdeaId(ev.ideaId ?? null);
            setThinking(null);
            setPhase("done");
          } else if (ev.type === "error") {
            setError(ev.message);
            setPhase("done");
            setThinking(null);
          }
        }
      }
    } catch (e) {
      setError((e as Error).message);
      setPhase("done");
    }
  }

  return (
    <div className="grid gap-6">
      {/* Convene bar */}
      <div className="card p-5">
        <label className="mb-2 block text-sm font-bold">{t("council.topic.label")}</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t("council.topic.ph")}
            disabled={phase === "running"}
            className="flex-1 rounded-full border border-line bg-white px-5 py-3 text-sm font-medium outline-none focus:border-accent"
          />
          <button
            onClick={convene}
            disabled={phase === "running"}
            className="btn-primary disabled:opacity-60"
          >
            {phase === "running" ? t("council.running") : t("council.run")} ⚖️
          </button>
        </div>
      </div>

      {/* Seats */}
      {phase !== "idle" && (
        <div className="flex flex-wrap gap-2">
          {order.concat("chair").map((id) => {
            const m = PERSONA_META[id];
            const active = thinking === id;
            return (
              <span
                key={id}
                className={`chip transition ${active ? "ring-2 ring-accent" : ""}`}
              >
                <span>{m.emoji}</span>
                {lang === "ar" ? m.nameAr : m.name}
                {active && <span className="animate-blink text-accent">●</span>}
              </span>
            );
          })}
        </div>
      )}

      {/* Debate transcript */}
      {turns.length > 0 && (
        <div
          ref={scrollRef}
          className="thin-scroll card max-h-[52vh] space-y-4 overflow-y-auto p-5"
        >
          {turns.map((turn, i) => (
            <Bubble key={i} turn={turn} lang={lang} />
          ))}
          {phase === "running" && !verdict && thinking && (
            <div className="flex items-center gap-2 text-sm font-semibold text-muted">
              <span>{PERSONA_META[thinking].emoji}</span>
              <span className="animate-blink">…</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="card border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Verdict + approve */}
      {verdict && (
        <div className="grid gap-4">
          <VerdictPanel verdict={verdict} />
          {ideaId && <ApproveBar ideaId={ideaId} />}
        </div>
      )}
    </div>
  );
}

function ApproveBar({ ideaId }: { ideaId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <GenerateScriptButton
      ideaId={ideaId}
      label={t("council.approve")}
      onSuccess={() => router.push(`/idea/${ideaId}`)}
    />
  );
}

function Bubble({ turn, lang }: { turn: TranscriptTurn; lang: "en" | "ar" }) {
  const m = PERSONA_META[turn.agent];
  return (
    <div className="flex animate-fade-up gap-3">
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg ring-2 ${m.ring}`}
      >
        {m.emoji}
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-bold">{lang === "ar" ? m.nameAr : m.name}</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            R{turn.round}
          </span>
        </div>
        <p className="rounded-xl2 rounded-tl-sm bg-canvas px-4 py-3 text-sm font-medium leading-relaxed">
          {turn.text}
        </p>
      </div>
    </div>
  );
}

