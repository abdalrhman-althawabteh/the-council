import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client using the service key. Never import this in client components.
let cached: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

// True when Supabase is configured — lets pages/routes degrade gracefully in
// local/demo runs without a project wired up yet.
export function hasDb(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}
