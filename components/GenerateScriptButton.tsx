"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

// Shared, robust script generator — used by the idea page and the council room.
// Checks res.ok, surfaces errors, and only calls onSuccess when a script really
// got written. (Fixes the old ApproveBar that navigated even on failure.)
export function GenerateScriptButton({
  ideaId,
  onSuccess,
  label,
}: {
  ideaId: string;
  onSuccess: () => void;
  label?: string;
}) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/council/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, lang }),
      });
      if (!r.ok) {
        throw new Error((await r.json().catch(() => ({})))?.error ?? `HTTP ${r.status}`);
      }
      onSuccess();
    } catch (e) {
      setError(`${t("idea.scriptFailed")} (${(e as Error).message})`);
      setBusy(false);
    }
    // note: on success we leave busy=true — the caller navigates/refreshes away
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button onClick={generate} disabled={busy} className="btn-primary disabled:opacity-60">
        {busy ? t("idea.generating") : label ?? t("idea.makeScript")} ✍
      </button>
      {busy && (
        <p className="text-xs font-semibold text-muted">
          {lang === "ar" ? "يستغرق هذا حوالي دقيقة…" : "This takes about a minute…"}
        </p>
      )}
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}
