"use client";

import Link from "next/link";
import type { Funnel, Idea } from "@/lib/types";
import { FUNNEL_META } from "./personas";
import { IdeaCard } from "./IdeaCard";
import { useI18n } from "@/lib/i18n";

const COLUMNS: Funnel[] = ["tof", "mof", "bof"];

export function FunnelBoard({ ideas }: { ideas: Idea[] }) {
  const { t, lang } = useI18n();
  const byFunnel = (f: Funnel) => ideas.filter((i) => i.funnel === f);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((f) => {
        const meta = FUNNEL_META[f];
        const items = byFunnel(f);
        return (
          <div key={f} className="rounded-xl2 border border-line bg-white/50 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-extrabold">
                  {lang === "ar" ? meta.labelAr : meta.label}
                </h3>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {t(`funnel.${f}.sub` as any)}
                </p>
              </div>
              <span className={`chip border ${meta.tone}`}>{items.length}</span>
            </div>
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-xl2 border border-dashed border-line px-3 py-8 text-center text-xs font-medium text-muted">
                  —
                </div>
              ) : (
                items.map((i) => <IdeaCard key={i.id} idea={i} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState() {
  const { lang } = useI18n();
  return (
    <div className="card p-10 text-center">
      <p className="text-lg font-bold">
        {lang === "ar" ? "لا توجد أفكار بعد" : "No ideas yet"}
      </p>
      <p className="mt-1 text-sm text-muted">
        {lang === "ar"
          ? "اعقد جلسة المجلس لتوليد أول فكرة."
          : "Convene the council to generate your first idea."}
      </p>
      <Link href="/council" className="btn-primary mt-5">
        {lang === "ar" ? "اعقد الجلسة" : "Convene session"} ⚖️
      </Link>
    </div>
  );
}
