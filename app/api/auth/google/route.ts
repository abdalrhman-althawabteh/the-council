import { NextRequest, NextResponse } from "next/server";
import { oauthConsentUrl } from "@/lib/youtube";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const redirectUri = `${req.nextUrl.origin}/api/auth/callback`;
  return NextResponse.redirect(oauthConsentUrl(redirectUri));
}
