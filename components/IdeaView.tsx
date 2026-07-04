"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Idea, Verdict, ScriptRow } from "@/lib/types";
import { VerdictPanel } from "./VerdictPanel";
import { GenerateScriptButton } from "./GenerateScriptButton";
import { useI18n } from "@/lib/i18n";

export function IdeaView({
  idea,
  verdict,
  script,
}: {
  idea: Idea;
  verdict: Verdict | null;
  script: ScriptRow | null;
}) {
  const { t, lang } = useI18n();
  const router = useRouter();
  return (
    <div className="grid gap-6 py-6">
      <header>
        <span className="eyebrow">✎ {t("idea.title")}</span>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight">{idea.title_seed}</h1>
      </header>

      {verdict && <VerdictPanel verdict={verdict} />}

      {script ? (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{t("idea.script")}</h2>
            <Copy text={`${script.title}\n\n${script.script}`} />
          </div>
          <h3 className="text-xl font-bold text-accent-dark">{script.title}</h3>
          {script.hook && (
            <p className="mt-2 rounded-xl2 bg-accent-soft/50 px-4 py-3 text-sm font-semibold">
              {t("idea.hook")}: {script.hook}
            </p>
          )}
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {script.script}
          </pre>
        </div>
      ) : (
        <div className="card flex flex-col items-start gap-3 p-6">
          <p className="text-sm font-medium text-muted">
            {lang === "ar"
              ? "لا يوجد سكربت لهذه الفكرة بعد."
              : "No script for this idea yet."}
          </p>
          <GenerateScriptButton ideaId={idea.id} onSuccess={() => router.refresh()} />
        </div>
      )}
    </div>
  );
}

function Copy({ text }: { text: string }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="chip hover:border-accent hover:text-accent-dark"
    >
      {done ? t("idea.copied") : t("idea.copy")}
    </button>
  );
}
