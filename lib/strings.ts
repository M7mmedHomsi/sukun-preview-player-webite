/** The page's words, in the visitor's language (Arabic or English). The
 *  player's own labels are the app's (lib/l10n/app_*.arb). */
export type Lang = "ar" | "en";

/** "5 دقائق", "29 دقيقة": Arabic counts take their own noun form. */
function arMinutes(n: number): string {
  if (n === 1) return "دقيقة واحدة";
  if (n === 2) return "دقيقتان";
  if (n >= 3 && n <= 10) return `${n} دقائق`;
  return `${n} دقيقة`;
}

export const STRINGS = {
  en: {
    shared: "Shared with you from Sukun",
    appStore: "App Store",
    googlePlay: "Google Play",
    iphone: "iPhone",
    android: "Android",
    soon: "Coming soon",
    gone: "This link has run out.",
    gone2: "Ask for a new one, or get Sukun to listen to every session.",
    home: "Calm, sleep and focus, in Arabic and English.",
    play: "Play",
    pause: "Pause",
    seek: "Position in the session",
    back10: "Back 10 seconds",
    forward10: "Forward 10 seconds",
    voiceover: "Voiceover",
    hertz: (hz: string) => `${hz} Hz`,
    description: "Description",
    getApp: "Get Sukun",
    share: "Share",
    copied: "Link copied",
    favourite: "Save to favourites",
    close: "Close",
    appOnly: "This session plays in the Sukun app.",
    preview: (p: number, total: number) => `${p}-minute preview · ${total} min in the app`,
    endTitle: (p: number) => `That was the first ${p} minutes`,
    endBody: "Listen to the whole session, and every other one, in the Sukun app.",
    askTitle: "Continue in Sukun",
    askBody: "Save sessions, keep them for offline listening, and hear every one in full in the Sukun app.",
    scan: "Scan with your phone's camera",
    getOn: (store: string) => `Get it on ${store}`,
    soonOn: (store: string) => `Coming soon to the ${store}`,
    listenAgain: "Listen again",
    notNow: "Not now",
  },
  ar: {
    shared: "شاركه معك أحدهم من سُكون",
    appStore: "App Store",
    googlePlay: "Google Play",
    iphone: "آيفون",
    android: "أندرويد",
    soon: "قريبًا",
    gone: "انتهت صلاحية هذا الرابط.",
    gone2: "اطلب رابطًا جديدًا، أو حمّل سُكون لتستمع إلى كل الجلسات.",
    home: "هدوء ونوم وتركيز، بالعربية والإنجليزية.",
    play: "تشغيل",
    pause: "إيقاف مؤقت",
    seek: "الموضع في الجلسة",
    back10: "رجوع 10 ثوانٍ",
    forward10: "تقديم 10 ثوانٍ",
    voiceover: "التعليق الصوتي",
    hertz: (hz: string) => `${hz} هرتز`,
    description: "الوصف",
    getApp: "حمّل سُكون",
    share: "مشاركة",
    copied: "تم نسخ الرابط",
    favourite: "أضف إلى المفضلة",
    close: "إغلاق",
    appOnly: "تُشغَّل هذه الجلسة في تطبيق سُكون.",
    preview: (p: number, total: number) => `معاينة ${arMinutes(p)} · الجلسة ${arMinutes(total)} في التطبيق`,
    endTitle: (p: number) => `كانت هذه أول ${arMinutes(p)}`,
    endBody: "استمع إلى الجلسة كاملة، وإلى كل الجلسات الأخرى، في تطبيق سُكون.",
    askTitle: "أكمل في سُكون",
    askBody: "احفظ الجلسات، واحتفظ بها للاستماع دون إنترنت، واستمع إليها كاملة في تطبيق سُكون.",
    scan: "امسح الرمز بكاميرا هاتفك",
    getOn: (store: string) => `حمّله من ${store}`,
    soonOn: (store: string) => `قريبًا على ${store}`,
    listenAgain: "استمع مجددًا",
    notNow: "ليس الآن",
  },
} as const;

export type Strings = (typeof STRINGS)[Lang];

/** Arabic when the browser's first language is Arabic, else English. */
export function pickLang(acceptLanguage: string | null | undefined): Lang {
  const first = (acceptLanguage ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("ar") ? "ar" : "en";
}

/** Which store to offer first: the visitor's phone, else both (with QR). */
export type Platform = "ios" | "android" | "desktop";

export function pickPlatform(userAgent: string | null | undefined): Platform {
  const ua = userAgent ?? "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/** "111", "7.83": the frequency without a trailing ".0" (the app's
 *  TrackInfo.formatHertz). */
export function formatHertz(hz: number): string {
  return hz.toFixed(2).replace(/\.?0+$/, "");
}

/** The bots that open a link to draw its preview (WhatsApp, iMessage,
 *  Telegram, ...): they get the session's card, never its stream, and
 *  count no view. iMessage introduces itself as facebookexternalhit. */
export function isPreviewBot(userAgent: string | null | undefined): boolean {
  return /facebookexternalhit|facebot|whatsapp|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|skypeuripreview|pinterest|redditbot|googlebot|bingbot|applebot|vkshare|embedly|iframely|snapchat|viber|kakaotalk|line\/|signal|bot|crawler|spider|preview/i.test(
    userAgent ?? "",
  );
}
