"use client";

import { Suspense } from "react";
import { CouncilRoom } from "@/components/CouncilRoom";
import { useI18n } from "@/lib/i18n";

export default function CouncilPage() {
  const { t } = useI18n();
  return (
    <div className="py-6">
      <header className="mb-6">
        <span className="eyebrow">⚖️ {t("nav.council")}</span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t("council.title")}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t("council.desc")}</p>
      </header>
      <Suspense>
        <CouncilRoom />
      </Suspense>
    </div>
  );
}
