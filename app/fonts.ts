import localFont from "next/font/local";

// The app's own type (SukunDesign): Inter for Latin body text, Inter Tight
// for Latin at 20pt and up (Apple's SF Pro Display switch), IBM Plex Sans
// Arabic for Arabic. All SIL Open Font License, see THIRD_PARTY_NOTICES.md.
export const inter = localFont({
  src: [
    { path: "./fonts/Inter-Medium.ttf", weight: "500" },
    { path: "./fonts/Inter-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-latin",
  display: "swap",
});

export const interTight = localFont({
  src: [
    { path: "./fonts/InterTight-Medium.ttf", weight: "500" },
    { path: "./fonts/InterTight-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const plexArabic = localFont({
  src: [
    { path: "./fonts/IBMPlexSansArabic-Regular.ttf", weight: "400" },
    { path: "./fonts/IBMPlexSansArabic-Medium.ttf", weight: "500" },
    { path: "./fonts/IBMPlexSansArabic-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-arabic",
  display: "swap",
});
