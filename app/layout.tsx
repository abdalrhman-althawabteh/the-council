import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { Nav } from "@/components/Nav";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const plexAr = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-plex-ar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Council — YouTube Ideation",
  description: "An AI council that debates, classifies, and scripts your next YouTube video.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${jakarta.variable} ${plexAr.variable}`}>
      <body className="min-h-screen font-sans">
        <I18nProvider>
          <Nav />
          <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-6">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
