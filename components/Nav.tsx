"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n, type MsgKey } from "@/lib/i18n";
import { LogoL } from "./LogoL";

const links: { href: string; key: MsgKey }[] = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/council", key: "nav.council" },
  { href: "/research", key: "nav.research" },
  { href: "/settings", key: "nav.settings" },
];

export function Nav() {
  const { t, lang, setLang } = useI18n();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-glow">
            <LogoL size={22} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            {t("app.name")}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-ink text-white"
                    : "text-muted hover:bg-white hover:text-ink"
                }`}
              >
                {t(l.key)}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="chip font-bold hover:border-accent hover:text-accent-dark"
          aria-label="Toggle language"
        >
          {lang === "en" ? "العربية" : "EN"}
        </button>
      </div>
    </header>
  );
}
