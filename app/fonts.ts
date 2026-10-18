import localFont from "next/font/local";

// The app's own type: Inter for Latin, IBM Plex Sans Arabic for Arabic
// (both SIL Open Font License, see THIRD_PARTY_NOTICES.md).
export const inter = localFont({
  src: [
    { path: "./fonts/Inter-Medium.ttf", weight: "500" },
    { path: "./fonts/Inter-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-latin",
  display: "swap",
});

export const plexArabic = localFont({
  src: [
    { path: "./fonts/IBMPlexSansArabic-Regular.ttf", weight: "400" },
    { path: "./fonts/IBMPlexSansArabic-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-arabic",
  display: "swap",
});
