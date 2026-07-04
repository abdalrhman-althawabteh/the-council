"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Idea } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export function IdeaCard({ idea }: { idea: Idea }) {
  const { lang } = useI18n();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function del(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000); // auto-reset if not confirmed
      return;
    }
    setBusy(true);
    await fetch(`/api/ideas/${idea.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="group relative">
      <Link
        href={`/idea/${idea.id}`}
        className="card block p-4 transition hover:-translate-y-0.5 hover:shadow-glow"
      >
        <div className="mb-2 flex items-center justify-between">
          {idea.score != null && (
            <span className="text-xs font-bold text-accent-dark">{idea.score}/100</span>
          )}
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {idea.status}
          </span>
        </div>
        <p className="pe-6 text-sm font-bold leading-snug">{idea.title_seed}</p>
        {idea.summary && (
          <p className="mt-1.5 line-clamp-2 text-xs font-medium text-muted">{idea.summary}</p>
        )}
      </Link>

      {/* delete: two-click confirm, no blocking dialog */}
      <button
        onClick={del}
        disabled={busy}
        title={lang === "ar" ? "حذف" : "Delete"}
        className={`absolute end-2 top-2 rounded-full px-2 py-1 text-xs font-bold transition ${
          confirming
            ? "bg-red-600 text-white"
            : "bg-white/0 text-muted opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
        }`}
      >
        {busy ? "…" : confirming ? (lang === "ar" ? "تأكيد؟" : "Sure?") : "🗑"}
      </button>
    </div>
  );
}
