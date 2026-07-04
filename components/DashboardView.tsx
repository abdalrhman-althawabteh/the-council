"use client";

import Link from "next/link";
import type { Idea } from "@/lib/types";
import { FunnelBoard, EmptyState } from "./FunnelBoard";
import { useI18n } from "@/lib/i18n";

export interface Health {
  videos: number;
  totalViews: number;
  avgRetention: number | null;
  topTitle: string | null;
  connected: boolean;
}

export function DashboardView({ ideas, health }: { ideas: Idea[]; health: Health }) {
  const { t, lang } = useI18n();
  const fmt = (n: number) => new Intl.NumberFormat(lang === "ar" ? "ar" : "en").format(n);

  return (
    <div className="py-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">◷ {t("nav.dashboard")}</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t("app.name")}</h1>
          <p className="mt-1 text-muted">{t("app.tagline")}</p>
        </div>
        <Link href="/council" className="btn-primary">
          {t("common.new")} ⚖️
        </Link>
      </header>

      {/* Channel health strip */}
      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        <Stat label={lang === "ar" ? "الفيديوهات" : "Videos"} value={fmt(health.videos)} />
        <Stat label={lang === "ar" ? "إجمالي المشاهدات" : "Total views"} value={fmt(health.totalViews)} />
        <Stat
          label={lang === "ar" ? "متوسط الاستبقاء" : "Avg retention"}
          value={health.avgRetention != null ? `${health.avgRetention.toFixed(0)}%` : "—"}
          hint={!health.connected ? (lang === "ar" ? "اربط يوتيوب" : "connect YouTube") : undefined}
        />
        <Stat
          label={lang === "ar" ? "الأفضل أداءً" : "Top video"}
          value={health.topTitle ? truncate(health.topTitle, 22) : "—"}
          small
        />
      </div>

      {ideas.length === 0 ? <EmptyState /> : <FunnelBoard ideas={ideas} />}
    </div>
  );
}

function Stat({ label, value, hint, small }: { label: string; value: string; hint?: string; small?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-extrabold ${small ? "text-base leading-tight" : "text-2xl"}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] font-semibold text-accent-dark">{hint}</p>}
    </div>
  );
}

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n) + "…" : s);
