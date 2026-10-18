import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { pickLang } from "@/lib/strings";
import { inter, plexArabic } from "./fonts";
import "./globals.css";

// Link previews need full addresses (the default preview image): the
// site's own address, from SITE_URL or the one Vercel gives production.
function siteUrl(): URL {
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "Sukun",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6D9BEA" },
    { media: "(prefers-color-scheme: dark)", color: "#1B2A6B" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = pickLang((await headers()).get("accept-language"));
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`${inter.variable} ${plexArabic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
