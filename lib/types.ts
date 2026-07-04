export type Funnel = "tof" | "mof" | "bof";
export type IdeaStatus = "proposed" | "approved" | "scripted" | "rejected";
export type Lang = "en" | "ar";

export type PersonaId = "scout" | "audience" | "funnel" | "brand" | "chair";

export interface TranscriptTurn {
  agent: PersonaId;
  round: number;
  text: string;
}

export interface Verdict {
  score: number; // 0-100
  funnel: Funnel;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  title: string; // suggested video title
}

export interface Idea {
  id: string;
  title_seed: string;
  summary: string | null;
  funnel: Funnel | null;
  status: IdeaStatus;
  score: number | null;
  source: string | null;
  source_ref: string | null;
  created_at: string;
}

export interface CompetitorVideo {
  id: string;
  video_id: string;
  title: string;
  channel_title: string | null;
  url: string | null;
  thumbnail: string | null;
  views: number;
  published_at: string | null;
  query: string | null;
  why_relevant: string | null;
  segment: "tracked" | "market" | null;
  found_at: string;
}

export interface ChannelSnapshot {
  video_id: string;
  title: string;
  published_at: string | null;
  thumbnail: string | null;
  views: number;
  likes: number;
  comments: number;
  avg_view_pct: number | null;
  avg_view_sec: number | null;
  ctr: number | null;
  impressions: number | null;
  synced_at: string;
}

export interface CommentInsight {
  id: string;
  theme: string;
  summary: string;
  sentiment: string | null;
  sample: string | null;
  weight: number;
}

export interface ScriptRow {
  id: string;
  idea_id: string;
  title: string;
  hook: string | null;
  script: string;
  lang: Lang;
  created_at: string;
}
