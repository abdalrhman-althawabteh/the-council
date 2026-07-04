"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export function SettingsView({
  connected,
  researchHour,
  competitors,
  defaultLang,
}: {
  connected: boolean;
  researchHour: number;
  competitors: string[];
  defaultLang: "en" | "ar";
}) {
  const { t, lang, setLang } = useI18n();
  const params = useSearchParams();
  const justConnected = params.get("yt") === "connected";

  const [hour, setHour] = useState(researchHour);
  const [comps, setComps] = useState(competitors.join("\n"));
  const [defLang, setDefLang] = useState(defaultLang);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  async function save() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        research_hour: hour,
        competitors: comps.split("\n").map((c) => c.trim()).filter(Boolean),
        default_lang: defLang,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function sync() {
    setSyncing(lang === "ar" ? "جارٍ المزامنة…" : "Syncing…");
    const r = await fetch("/api/analytics/sync", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setSyncing(
      r.ok
        ? `${lang === "ar" ? "تمت المزامنة" : "Synced"}: ${j.videos ?? 0} videos, ${j.insights ?? 0} insights`
        : `${lang === "ar" ? "فشل" : "Failed"}: ${j.error ?? r.status}`,
    );
  }

  return (
    <div className="grid max-w-2xl gap-6 py-6">
      <header>
        <span className="eyebrow">⚙ {t("settings.title")}</span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t("settings.title")}</h1>
      </header>

      {/* YouTube connection */}
      <div className="card p-5">
        <h2 className="mb-1 text-lg font-extrabold">YouTube</h2>
        <p className="mb-4 text-sm text-muted">
          {lang === "ar"
            ? "اربط قناتك لسحب التحليلات الخاصة (الاستبقاء، CTR) والتعليقات."
            : "Connect your channel to pull private analytics (retention, CTR) and comments."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {connected || justConnected ? (
            <span className="chip border border-emerald-200 bg-emerald-50 text-emerald-700">
              ✓ {t("settings.connected")}
            </span>
          ) : (
            <a href="/api/auth/google" className="btn-dark">
              {t("settings.connect")}
            </a>
          )}
          <button onClick={sync} className="btn-outline">
            {t("settings.sync")}
          </button>
          {syncing && <span className="text-sm font-semibold text-muted">{syncing}</span>}
        </div>
      </div>

      {/* Research schedule + competitors */}
      <div className="card grid gap-4 p-5">
        <div>
          <label className="mb-1 block text-sm font-bold">{t("settings.schedule")}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-24 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold outline-none focus:border-accent"
            />
            {/* ponytail: Jordan hardcoded (UTC+3, no DST); add a country picker if ever needed */}
            <span className="text-sm text-muted">
              {lang === "ar" ? ":00 بتوقيت عمّان (UTC+3)" : ":00 Amman time (UTC+3)"}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-muted">
            {lang === "ar"
              ? `الأتمتة تعمل يوميًا حوالي الساعة ${hour}:00 صباحًا بتوقيت عمّان. لتشغيلها الآن، استخدم زر «ابحث الآن» في صفحة البحث.`
              : `Automation runs daily around ${hour}:00 Amman time. To run it right now, use “Run research now” on the Research page.`}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold">{t("settings.competitors")}</label>
          <textarea
            value={comps}
            onChange={(e) => setComps(e.target.value)}
            rows={4}
            placeholder={lang === "ar" ? "قناة لكل سطر" : "one channel per line"}
            className="w-full rounded-xl2 border border-line bg-white px-4 py-3 text-sm font-medium outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold">{t("settings.lang")}</label>
          <select
            value={defLang}
            onChange={(e) => {
              const l = e.target.value as "en" | "ar";
              setDefLang(l);
              setLang(l);
            }}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold outline-none focus:border-accent"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
        <button onClick={save} className="btn-primary self-start">
          {saved ? "✓" : lang === "ar" ? "حفظ" : "Save"}
        </button>
      </div>
    </div>
  );
}
