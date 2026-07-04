# The Council (المجلس) — YouTube Ideation

An AI council that debates your next YouTube video, classifies it by funnel stage
(TOF / MOF / BOF), and turns winners into a title + script. Built for the
"build a business with AI / Claude Code" niche. Bilingual (English / Arabic, RTL).

Stack: **Next.js (App Router) · Supabase · Anthropic · YouTube Data + Analytics API**, deploy on **Vercel**.

## How it works

- **The Council** — 5 Claude personas (Scout, Audience Advocate, Funnel Strategist,
  Brand-Fit Critic, Chair) debate an idea over 2 rounds, streamed live to the UI,
  then the Chair delivers a scored verdict. Approve → a script is written.
- **Daily research** — a Vercel cron sweeps YouTube for niche + competitor videos.
- **Channel sync** — pulls your public stats/comments (Data API) and private
  retention/CTR (Analytics API via OAuth); comments are summarized into themes
  that feed the council.

## Setup

### 1. Install & run
```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

### 2. Supabase
Create a project, then run `supabase/schema.sql` in the SQL editor. Copy
`SUPABASE_URL` and the **service_role** key into `.env.local`.

### 3. YouTube Data API (public data)
Google Cloud → enable **YouTube Data API v3** → create an API key → `YOUTUBE_API_KEY`.
Resolve your channel id once (any handle-to-id tool, or the app's
`channelIdFromHandle` helper) and set `YOUTUBE_CHANNEL_ID`.

### 4. Google OAuth (private analytics) — the one manual step
Retention / CTR / watch-time need OAuth because they're private to the channel owner.
1. Google Cloud → enable **YouTube Analytics API**.
2. **OAuth consent screen** → External → fill basics → **add yourself as a Test user**
   (keeps it in "testing" mode — no Google verification needed for personal use).
3. **Credentials → OAuth client ID → Web application**. Add redirect URIs:
   `http://localhost:PORT/api/auth/callback` and `https://YOUR_DOMAIN/api/auth/callback`.
4. Copy client id/secret → `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`.
5. In the app: **Settings → Connect YouTube** → consent → done.

### 5. Anthropic
`ANTHROPIC_API_KEY` from the Anthropic console.

### 6. Deploy (Vercel)
Push to a repo, import into Vercel, add all env vars, and set a `CRON_SECRET`
(Vercel sends it automatically to the daily `/api/research` cron defined in
`vercel.json`, scheduled 06:00 UTC).

## Env vars
See `.env.example`. All keys are server-side only.

## Notes
- Daily research cron fires at **03:00 UTC = 06:00 Asia/Amman (UTC+3)** (`vercel.json`). Vercel Hobby crons are daily-only; to change the time, edit the schedule and redeploy.
- Without Supabase/keys configured, the UI still renders (empty states) — nothing crashes.
- Comments are stored as **summarized themes**, not raw rows.
- Council debate is fixed at **2 rounds** (`ROUNDS` in `lib/council.ts`).
- Single-user (your channel); OAuth stores one channel token.
