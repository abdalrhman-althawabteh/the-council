import { Suspense } from "react";
import { db, hasDb } from "@/lib/supabase";
import { SettingsView } from "@/components/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let connected = false;
  let researchHour = 6;
  let competitors: string[] = [];
  let defaultLang: "en" | "ar" = "en";

  if (hasDb()) {
    const [{ data: tok }, { data: s }] = await Promise.all([
      db().from("oauth_tokens").select("id").eq("id", 1).maybeSingle(),
      db().from("app_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    connected = Boolean(tok);
    researchHour = s?.research_hour ?? 6;
    competitors = s?.competitors ?? [];
    defaultLang = s?.default_lang ?? "en";
  }

  return (
    <Suspense>
      <SettingsView
        connected={connected}
        researchHour={researchHour}
        competitors={competitors}
        defaultLang={defaultLang}
      />
    </Suspense>
  );
}
