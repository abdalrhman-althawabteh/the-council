import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/youtube";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${req.nextUrl.origin}/settings?yt=error`);
  }
  try {
    const redirectUri = `${req.nextUrl.origin}/api/auth/callback`;
    const tok = await exchangeCode(code, redirectUri);
    if (!tok.refresh_token) {
      // Google only returns refresh_token on first consent; force re-consent.
      return NextResponse.redirect(`${req.nextUrl.origin}/settings?yt=noretoken`);
    }
    await db()
      .from("oauth_tokens")
      .upsert({
        id: 1,
        refresh_token: tok.refresh_token,
        access_token: tok.access_token,
        expiry: new Date(Date.now() + tok.expires_in * 1000).toISOString(),
        channel_id: process.env.YOUTUBE_CHANNEL_ID ?? null,
        updated_at: new Date().toISOString(),
      });
    return NextResponse.redirect(`${req.nextUrl.origin}/settings?yt=connected`);
  } catch (e) {
    console.error("[oauth callback]", e);
    return NextResponse.redirect(`${req.nextUrl.origin}/settings?yt=error`);
  }
}
