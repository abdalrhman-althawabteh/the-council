"use client";

import type { Verdict } from "@/lib/types";
import { FUNNEL_META } from "./personas";
import { useI18n } from "@/lib/i18n";

export function VerdictPanel({ verdict }: { verdict: Verdict }) {
  const { t, lang } = useI18n();
  const f = FUNNEL_META[verdict.funnel];

  return (
    <div className="card animate-slide-in overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className={`chip border ${f.tone}`}>
              {lang === "ar" ? f.labelAr : f.label}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("council.verdict")}
            </span>
          </div>
          <h3 className="text-2xl font-extrabold leading-tight">{verdict.title}</h3>
          <p className="mt-2 max-w-xl text-sm font-medium text-muted">
            {verdict.recommendation}
          </p>
        </div>
        <ScoreDial score={verdict.score} label={t("council.score")} />
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-2">
        <Col title={t("council.strengths")} items={verdict.strengths} tone="text-emerald-700" bullet="✓" />
        <Col title={t("council.weaknesses")} items={verdict.weaknesses} tone="text-accent-dark" bullet="!" />
      </div>
    </div>
  );
}

function Col({ title, items, tone, bullet }: { title: string; items: string[]; tone: string; bullet: string }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">{title}</h4>
      <ul className="space-y-2">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-sm font-medium">
            <span className={`mt-0.5 font-bold ${tone}`}>{bullet}</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreDial({ score, label }: { score: number; label: string }) {
  const deg = (score / 100) * 360;
  return (
    <div className="flex flex-col items-center">
      <div
        className="grid h-24 w-24 place-items-center rounded-full"
        style={{ background: `conic-gradient(#F15E28 ${deg}deg, #F0EAE4 0deg)` }}
      >
        <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-white">
          <span className="text-2xl font-extrabold">{score}</span>
        </div>
      </div>
      <span className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}
