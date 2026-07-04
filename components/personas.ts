import type { PersonaId, Funnel } from "@/lib/types";

// Client-safe display metadata (no server imports).
export const PERSONA_META: Record<
  PersonaId,
  { name: string; nameAr: string; emoji: string; ring: string; chip: string }
> = {
  scout: { name: "The Scout", nameAr: "الكشّاف", emoji: "🔭", ring: "ring-sky-400", chip: "bg-sky-50 text-sky-700" },
  audience: { name: "Audience Advocate", nameAr: "صوت الجمهور", emoji: "🗣️", ring: "ring-violet-400", chip: "bg-violet-50 text-violet-700" },
  funnel: { name: "Funnel Strategist", nameAr: "استراتيجي القمع", emoji: "🎯", ring: "ring-accent", chip: "bg-accent-soft text-accent-dark" },
  brand: { name: "Brand-Fit Critic", nameAr: "ناقد الهوية", emoji: "🧭", ring: "ring-emerald-400", chip: "bg-emerald-50 text-emerald-700" },
  chair: { name: "The Chair", nameAr: "رئيس المجلس", emoji: "⚖️", ring: "ring-ink", chip: "bg-ink text-white" },
};

export const FUNNEL_META: Record<
  Funnel,
  { label: string; labelAr: string; tone: string; sub: string }
> = {
  tof: { label: "Top of Funnel", labelAr: "أعلى القمع", tone: "bg-sky-100 text-sky-800 border-sky-200", sub: "Reach" },
  mof: { label: "Middle of Funnel", labelAr: "منتصف القمع", tone: "bg-amber-100 text-amber-800 border-amber-200", sub: "Nurture" },
  bof: { label: "Bottom of Funnel", labelAr: "أسفل القمع", tone: "bg-accent-soft text-accent-dark border-accent/30", sub: "Convert" },
};
