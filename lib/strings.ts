/** The page's words, in the visitor's language (Arabic or English). */
export type Lang = "ar" | "en";

export const STRINGS = {
  en: {
    from: "Someone sent you this session from Sukun.",
    get: "Get Sukun",
    gone: "This link has run out.",
    gone2: "Ask for a new one, or get Sukun to listen to every session.",
    minutes: (n: number) => `${n} min`,
    home: "Calm, sleep and focus, in Arabic and English.",
  },
  ar: {
    from: "أرسل لك أحدهم هذه الجلسة من سُكون.",
    get: "حمّل سُكون",
    gone: "انتهت صلاحية هذا الرابط.",
    gone2: "اطلب رابطًا جديدًا، أو حمّل سُكون لتستمع إلى كل الجلسات.",
    minutes: (n: number) => `${n} دقيقة`,
    home: "هدوء ونوم وتركيز، بالعربية والإنجليزية.",
  },
} as const;

/** Arabic when the browser's first language is Arabic, else English. */
export function pickLang(acceptLanguage: string | null | undefined): Lang {
  const first = (acceptLanguage ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("ar") ? "ar" : "en";
}
