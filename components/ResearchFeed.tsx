"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CompetitorVideo } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export function ResearchFeed({
  tracked,
  market,
}: {
  tracked: CompetitorVideo[];
  market: CompetitorVideo[];
}) {
  const { t } = useI18n();

  return (
    <div className="py-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">🔭 {t("research.title")}</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t("research.title")}</h1>
          <p className="mt-1 text-muted">{t("research.desc")}</p>
        </div>
        <RunNow />
      </header>

      {tracked.length === 0 && market.length === 0 ? (
        <div className="card p-10 text-center text-sm font-medium text-muted">
          {t("research.empty")}
        </div>
      ) : (
        <div className="grid gap-10">
          <VideoSection
            title={t("research.tracked")}
            sub={t("research.tracked.sub")}
            videos={tracked}
            tone="border-accent/30 bg-accent-soft text-accent-dark"
          />
          <VideoSection
            title={t("research.market")}
            sub={t("research.market.sub")}
            videos={market}
            tone="border-sky-200 bg-sky-50 text-sky-700"
          />
        </div>
      )}
    </div>
  );
}

function RunNow() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setNote(null);
    try {
      const r1 = await fetch("/api/research", { method: "POST" });
      if (!r1.ok) throw new Error((await r1.json().catch(() => ({})))?.error ?? `research ${r1.status}`);
      await fetch("/api/analytics/sync", { method: "POST" }); // channel + comments; non-fatal
      router.refresh();
    } catch (e) {
      setNote(`${lang === "ar" ? "فشل" : "Failed"}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={run} disabled={busy} className="btn-primary disabled:opacity-60">
        {busy ? t("research.running") : t("research.run")} 🔭
      </button>
      {note && <span className="text-xs font-semibold text-red-600">{note}</span>}
    </div>
  );
}

function VideoSection({
  title,
  sub,
  videos,
  tone,
}: {
  title: string;
  sub: string;
  videos: CompetitorVideo[];
  tone: string;
}) {
  const { lang } = useI18n();
  if (videos.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-xl font-extrabold">{title}</h2>
        <span className={`chip border ${tone}`}>{videos.length}</span>
        <span className="hidden text-xs font-medium text-muted sm:inline">{sub}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {videos.map((v) => (
          <VideoCard key={v.id} v={v} lang={lang} />
        ))}
      </div>
    </section>
  );
}

function VideoCard({ v, lang }: { v: CompetitorVideo; lang: "en" | "ar" }) {
  const { t } = useI18n();
  const fmt = (n: number) => new Intl.NumberFormat(lang === "ar" ? "ar" : "en").format(n);
  return (
    <div className="card flex gap-3 overflow-hidden p-3">
      {v.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v.thumbnail} alt="" className="h-20 w-32 shrink-0 rounded-lg object-cover" />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <a
          href={v.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="line-clamp-2 text-sm font-bold hover:text-accent-dark"
        >
          {v.title}
        </a>
        <p className="mt-0.5 truncate text-xs font-medium text-muted">
          {v.channel_title} · {fmt(v.views)} {lang === "ar" ? "مشاهدة" : "views"}
        </p>
        <Link
          href={`/council?topic=${encodeURIComponent(v.title)}&ref=${v.video_id}`}
          className="mt-auto self-start pt-2 text-xs font-bold text-accent-dark hover:underline"
        >
          {t("research.send")} →
        </Link>
      </div>
    </div>
  );
}
