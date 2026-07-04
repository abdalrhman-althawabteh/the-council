"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "ar";

// Flat dictionaries. Add keys as pages grow. Missing key falls back to EN, then the key itself.
const dict = {
  en: {
    "app.name": "The Council",
    "app.tagline": "AI ideation board for your YouTube channel",
    "nav.dashboard": "Dashboard",
    "nav.council": "Council Room",
    "nav.research": "Research",
    "nav.settings": "Settings",
    "funnel.tof": "Top of Funnel",
    "funnel.mof": "Middle of Funnel",
    "funnel.bof": "Bottom of Funnel",
    "funnel.tof.sub": "Reach — open new eyes",
    "funnel.mof.sub": "Nurture — build trust",
    "funnel.bof.sub": "Convert — into the community",
    "council.title": "Convene the Council",
    "council.desc": "Five AI advisors debate your next video, classify its funnel stage, and rule on it.",
    "council.run": "Convene session",
    "council.running": "The council is in session…",
    "council.verdict": "Verdict",
    "council.strengths": "Strengths",
    "council.weaknesses": "Weaknesses",
    "council.score": "Council score",
    "council.approve": "Approve & write script",
    "council.topic.label": "Seed topic (optional)",
    "council.topic.ph": "e.g. Building a SaaS with Claude Code in a weekend",
    "idea.title": "Idea",
    "idea.script": "Script",
    "idea.hook": "Hook",
    "idea.copy": "Copy",
    "idea.copied": "Copied!",
    "research.title": "Daily Research",
    "research.desc": "Competitor & niche videos the scout pulled from YouTube.",
    "research.send": "Send to council",
    "research.empty": "No research yet. Run a sync or wait for the daily job.",
    "research.tracked": "My competitors",
    "research.tracked.sub": "Latest uploads from the channels you track",
    "research.market": "Market finds",
    "research.market.sub": "What the scout discovered across the niche",
    "research.run": "Run research now",
    "research.running": "Researching…",
    "research.comments": "Ideas from your comments",
    "research.comments.sub": "Video ideas your viewers are asking for",
    "idea.makeScript": "Generate script",
    "idea.generating": "Writing the script…",
    "idea.scriptFailed": "Script generation failed — try again.",
    "settings.title": "Settings",
    "settings.connect": "Connect YouTube",
    "settings.connected": "YouTube connected",
    "settings.sync": "Sync channel now",
    "settings.schedule": "Daily research time",
    "settings.competitors": "Tracked competitor channels",
    "settings.lang": "Default language",
    "common.loading": "Loading…",
    "common.new": "New session",
    "hero.badge": "AI ideation for creators",
    "hero.cta": "Enter the Council Room",
    "hero.secondary": "View dashboard",
  },
  ar: {
    "app.name": "المجلس",
    "app.tagline": "مجلس أفكار بالذكاء الاصطناعي لقناتك على يوتيوب",
    "nav.dashboard": "الرئيسية",
    "nav.council": "قاعة المجلس",
    "nav.research": "البحث",
    "nav.settings": "الإعدادات",
    "funnel.tof": "أعلى القمع",
    "funnel.mof": "منتصف القمع",
    "funnel.bof": "أسفل القمع",
    "funnel.tof.sub": "الوصول — فتح عيون جديدة",
    "funnel.mof.sub": "الرعاية — بناء الثقة",
    "funnel.bof.sub": "التحويل — إلى المجتمع",
    "council.title": "اعقد جلسة المجلس",
    "council.desc": "خمسة مستشارين بالذكاء الاصطناعي يناقشون فكرة فيديوك القادم ويصنّفون مرحلته في القمع ويحكمون عليه.",
    "council.run": "اعقد الجلسة",
    "council.running": "المجلس منعقد الآن…",
    "council.verdict": "الحكم",
    "council.strengths": "نقاط القوة",
    "council.weaknesses": "نقاط الضعف",
    "council.score": "تقييم المجلس",
    "council.approve": "اعتماد وكتابة السكربت",
    "council.topic.label": "الموضوع المبدئي (اختياري)",
    "council.topic.ph": "مثال: بناء SaaS باستخدام Claude Code في عطلة نهاية أسبوع",
    "idea.title": "الفكرة",
    "idea.script": "السكربت",
    "idea.hook": "الافتتاحية",
    "idea.copy": "نسخ",
    "idea.copied": "تم النسخ!",
    "research.title": "البحث اليومي",
    "research.desc": "فيديوهات المنافسين والمجال التي جمعها الكشّاف من يوتيوب.",
    "research.send": "أرسل إلى المجلس",
    "research.empty": "لا يوجد بحث بعد. شغّل المزامنة أو انتظر المهمة اليومية.",
    "research.tracked": "قنواتي المتابَعة",
    "research.tracked.sub": "أحدث فيديوهات القنوات التي تتابعها",
    "research.market": "اكتشافات السوق",
    "research.market.sub": "ما اكتشفه الكشّاف في المجال",
    "research.run": "ابحث الآن",
    "research.running": "جارٍ البحث…",
    "research.comments": "أفكار من تعليقات جمهورك",
    "research.comments.sub": "أفكار فيديوهات يطلبها جمهورك",
    "idea.makeScript": "اكتب السكربت",
    "idea.generating": "جارٍ كتابة السكربت…",
    "idea.scriptFailed": "فشلت كتابة السكربت — حاول مرة أخرى.",
    "settings.title": "الإعدادات",
    "settings.connect": "ربط يوتيوب",
    "settings.connected": "تم ربط يوتيوب",
    "settings.sync": "مزامنة القناة الآن",
    "settings.schedule": "وقت البحث اليومي",
    "settings.competitors": "قنوات المنافسين المتابَعة",
    "settings.lang": "اللغة الافتراضية",
    "common.loading": "جارٍ التحميل…",
    "common.new": "جلسة جديدة",
    "hero.badge": "أفكار بالذكاء الاصطناعي للصنّاع",
    "hero.cta": "ادخل قاعة المجلس",
    "hero.secondary": "عرض اللوحة",
  },
} as const;

export type MsgKey = keyof (typeof dict)["en"];

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: MsgKey) => string };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" &&
      (localStorage.getItem("lang") as Lang)) as Lang | null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    if (typeof window !== "undefined") localStorage.setItem("lang", lang);
  }, [lang]);

  const t = (k: MsgKey) => dict[lang][k] ?? dict.en[k] ?? k;
  return (
    <I18nContext.Provider value={{ lang, setLang: setLangState, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
