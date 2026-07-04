"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const personas = ["Scout", "Audience", "Funnel", "Brand-Fit", "Chair"];
const stack = ["Claude Code", "YouTube API", "Funnel Strategy", "Analytics", "Claude"];

export default function Home() {
  const { t, lang } = useI18n();

  return (
    <section className="flex flex-col items-center py-14 text-center md:py-20">
      <span className="eyebrow animate-fade-up">✦ {t("hero.badge")}</span>

      <h1 className="mt-7 max-w-4xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight animate-fade-up md:text-7xl">
        {lang === "ar" ? (
          <>
            مجلسٌ من الذكاء الاصطناعي يبني <span className="mark">أفكار</span> قناتك
          </>
        ) : (
          <>
            An AI council that turns raw ideas into your{" "}
            <span className="mark">next video</span>
          </>
        )}
      </h1>

      <p className="mt-6 max-w-xl text-lg font-medium text-muted animate-fade-up">
        {t("council.desc")}
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-fade-up">
        <Link href="/council" className="btn-primary">
          {t("hero.cta")} →
        </Link>
        <Link href="/dashboard" className="btn-outline">
          {t("hero.secondary")}
        </Link>
      </div>

      <div className="mt-16 flex flex-wrap items-center justify-center gap-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {lang === "ar" ? "المجلس" : "The board"}
        </span>
        {personas.map((p) => (
          <span key={p} className="chip">
            {p}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {lang === "ar" ? "يعمل مع" : "Works with"}
        </span>
        {stack.map((s) => (
          <span key={s} className="chip">
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}
