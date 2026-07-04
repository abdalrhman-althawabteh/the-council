// YouTube integration — plain fetch against the REST APIs (no googleapis dep).
// Public data uses the Data API key; private analytics uses the owner's OAuth token.
import { db } from "./supabase";

const DATA = "https://www.googleapis.com/youtube/v3";
const ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports";
const OAUTH_TOKEN = "https://oauth2.googleapis.com/token";
const OAUTH_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";

// Scopes: readonly YouTube + readonly Analytics (private retention/CTR).
export const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
].join(" ");

function key(): string {
  const k = process.env.YOUTUBE_API_KEY;
  if (!k) throw new Error("Missing YOUTUBE_API_KEY");
  return k;
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`YouTube ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ---- Public Data API --------------------------------------------------------

export interface YtVideo {
  video_id: string;
  title: string;
  channel_title?: string;
  channel_id?: string;
  thumbnail?: string;
  published_at?: string;
  views?: number;
  likes?: number;
  comments?: number;
  url: string;
}

/** Resolve a channel id from an @handle, URL, raw UC… id, or channel name. */
export async function channelIdFromHandle(input: string): Promise<string | null> {
  const raw = input.trim();
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(raw)) return raw; // already an id
  const urlId = raw.match(/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (urlId) return urlId[1];
  // "https://youtube.com/@foo", "@foo", or "foo" → handle "foo"
  const h = (raw.split("/").pop() ?? raw).replace(/^@/, "").split("?")[0];
  const r = await j<any>(
    await fetch(`${DATA}/channels?part=id&forHandle=${encodeURIComponent(h)}&key=${key()}`),
  );
  if (r.items?.[0]?.id) return r.items[0].id;
  // last resort: search channels by name
  const s = await j<any>(
    await fetch(
      `${DATA}/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(raw)}&key=${key()}`,
    ),
  );
  return s.items?.[0]?.snippet?.channelId ?? null;
}

/** Keyword search across YouTube for the niche/market. */
export async function search(query: string, max = 10): Promise<YtVideo[]> {
  const r = await j<any>(
    await fetch(
      `${DATA}/search?part=snippet&type=video&order=relevance&maxResults=${max}` +
        `&q=${encodeURIComponent(query)}&relevanceLanguage=en&key=${key()}`,
    ),
  );
  return (r.items ?? []).map((it: any) => ({
    video_id: it.id.videoId,
    title: it.snippet.title,
    channel_title: it.snippet.channelTitle,
    channel_id: it.snippet.channelId,
    thumbnail: it.snippet.thumbnails?.medium?.url,
    published_at: it.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
  }));
}

/** Fetch view/like/comment stats for a batch of video ids (<=50). */
export async function statsFor(ids: string[]): Promise<Record<string, YtVideo>> {
  if (!ids.length) return {};
  const r = await j<any>(
    await fetch(
      `${DATA}/videos?part=snippet,statistics&id=${ids.slice(0, 50).join(",")}&key=${key()}`,
    ),
  );
  const out: Record<string, YtVideo> = {};
  for (const it of r.items ?? []) {
    out[it.id] = {
      video_id: it.id,
      title: it.snippet.title,
      channel_title: it.snippet.channelTitle,
      channel_id: it.snippet.channelId,
      thumbnail: it.snippet.thumbnails?.medium?.url,
      published_at: it.snippet.publishedAt,
      views: Number(it.statistics?.viewCount ?? 0),
      likes: Number(it.statistics?.likeCount ?? 0),
      comments: Number(it.statistics?.commentCount ?? 0),
      url: `https://www.youtube.com/watch?v=${it.id}`,
    };
  }
  return out;
}

/** Newest uploads for any channel (via its uploads playlist) — reliable & cheap. */
export async function channelUploads(channelId: string, max = 25): Promise<string[]> {
  const ch = await j<any>(
    await fetch(`${DATA}/channels?part=contentDetails&id=${channelId}&key=${key()}`),
  );
  const playlist = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlist) return [];
  const pl = await j<any>(
    await fetch(
      `${DATA}/playlistItems?part=contentDetails&maxResults=${max}&playlistId=${playlist}&key=${key()}`,
    ),
  );
  return (pl.items ?? []).map((it: any) => it.contentDetails.videoId);
}

/** Top-level comments on a video (for theme summarization). */
export async function comments(videoId: string, max = 40): Promise<string[]> {
  try {
    const r = await j<any>(
      await fetch(
        `${DATA}/commentThreads?part=snippet&order=relevance&maxResults=${max}&videoId=${videoId}&key=${key()}`,
      ),
    );
    return (r.items ?? []).map(
      (it: any) => it.snippet.topLevelComment.snippet.textOriginal as string,
    );
  } catch {
    return []; // comments disabled / not found — non-fatal
  }
}

/** Title + full description for one video (script reference material). */
export async function videoDetails(
  videoId: string,
): Promise<{ title: string; description: string; channel: string } | null> {
  const r = await j<any>(
    await fetch(`${DATA}/videos?part=snippet&id=${videoId}&key=${key()}`),
  );
  const s = r.items?.[0]?.snippet;
  if (!s) return null;
  return { title: s.title, description: s.description ?? "", channel: s.channelTitle ?? "" };
}

/**
 * Best-effort transcript via YouTube's public innertube player endpoint.
 * ponytail: unofficial but auth-free; if YouTube blocks it we still have
 * description+comments as reference — callers must treat null as normal.
 */
export async function transcriptFor(videoId: string): Promise<string | null> {
  try {
    const player = await fetch(
      "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
          videoId,
        }),
      },
    );
    if (!player.ok) return null;
    const data = await player.json();
    const tracks =
      data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (!tracks.length) return null;
    // prefer English or Arabic, else first track
    const track =
      tracks.find((t: any) => /^(en|ar)/.test(t.languageCode)) ?? tracks[0];
    const xml = await (await fetch(track.baseUrl)).text();
    const text = xml
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;#39;|&#39;/g, "'")
      .replace(/&amp;|&quot;|&lt;|&gt;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 100 ? text.slice(0, 12000) : null;
  } catch {
    return null;
  }
}

// ---- OAuth (private analytics) ----------------------------------------------

export function oauthConsentUrl(redirectUri: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: OAUTH_SCOPES,
    access_type: "offline",
    prompt: "consent",
  });
  return `${OAUTH_AUTH}?${p}`;
}

export async function exchangeCode(code: string, redirectUri: string) {
  const r = await j<any>(
    await fetch(OAUTH_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    }),
  );
  return r as { access_token: string; refresh_token?: string; expires_in: number };
}

/** Get a fresh access token from the stored refresh token. */
async function accessToken(): Promise<string> {
  const { data } = await db()
    .from("oauth_tokens")
    .select("refresh_token")
    .eq("id", 1)
    .single();
  if (!data?.refresh_token) throw new Error("YouTube not connected (no OAuth token)");
  const r = await j<any>(
    await fetch(OAUTH_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: data.refresh_token,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
        grant_type: "refresh_token",
      }),
    }),
  );
  return r.access_token;
}

export interface PrivateMetrics {
  avg_view_pct: number | null;
  avg_view_sec: number | null;
}

/**
 * Private per-video analytics for the channel over a date range.
 * Returns a map video_id -> metrics. Needs OAuth connection.
 * ponytail: impressions & CTR are NOT in the public Analytics API (Studio-only) —
 * requesting them 400s the whole query. Retention (avg_view_pct) + avg view
 * duration are what the API exposes, and cover "watch time + retention".
 */
export async function privateAnalytics(
  startDate = "2020-01-01",
  endDate = today(),
): Promise<Record<string, PrivateMetrics>> {
  const token = await accessToken();
  // Documented "top videos" report: sort must be a core metric in the list.
  const metrics = "views,averageViewPercentage,averageViewDuration";
  const url =
    `${ANALYTICS}?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}` +
    `&metrics=${metrics}&dimensions=video&sort=-views&maxResults=200`;
  const r = await j<any>(
    await fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
  );
  const cols: string[] = (r.columnHeaders ?? []).map((c: any) => c.name);
  const out: Record<string, PrivateMetrics> = {};
  for (const row of r.rows ?? []) {
    const rec: any = {};
    cols.forEach((c, i) => (rec[c] = row[i]));
    out[rec.video] = {
      avg_view_pct: num(rec.averageViewPercentage),
      avg_view_sec: num(rec.averageViewDuration),
    };
  }
  return out;
}

const num = (v: unknown): number | null =>
  v === undefined || v === null ? null : Number(v);

// Date.now()/new Date() argless are unavailable in workflow scripts but fine in
// app runtime; format YYYY-MM-DD for the Analytics API.
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
