/** The page's words, in the visitor's language (Arabic or English). */
export type Lang = "ar" | "en";

export const STRINGS = {
  en: {
    shared: "Shared with you from Sukun",
    getTitle: "Listen to every session in Sukun",
    getBody: "Scan with your phone's camera, or tap to open the store.",
    appStore: "App Store",
    googlePlay: "Google Play",
    iphone: "iPhone",
    android: "Android",
    open: "Open",
    soon: "Coming soon",
    gone: "This link has run out.",
    gone2: "Ask for a new one, or get Sukun to listen to every session.",
    minutes: (n: number) => `${n} min`,
    home: "Calm, sleep and focus, in Arabic and English.",
    play: "Play",
    pause: "Pause",
    seek: "Position in the session",
  },
  ar: {
    shared: "شاركه معك أحدهم من سُكون",
    getTitle: "استمع إلى كل الجلسات في سُكون",
    getBody: "امسح الرمز بكاميرا هاتفك، أو اضغط لفتح المتجر.",
    appStore: "App Store",
    googlePlay: "Google Play",
    iphone: "آيفون",
    android: "أندرويد",
    open: "فتح",
    soon: "قريبًا",
    gone: "انتهت صلاحية هذا الرابط.",
    gone2: "اطلب رابطًا جديدًا، أو حمّل سُكون لتستمع إلى كل الجلسات.",
    minutes: (n: number) => `${n} دقيقة`,
    home: "هدوء ونوم وتركيز، بالعربية والإنجليزية.",
    play: "تشغيل",
    pause: "إيقاف مؤقت",
    seek: "الموضع في الجلسة",
  },
} as const;

export type Strings = (typeof STRINGS)[Lang];

/** Arabic when the browser's first language is Arabic, else English. */
export function pickLang(acceptLanguage: string | null | undefined): Lang {
  const first = (acceptLanguage ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("ar") ? "ar" : "en";
}
