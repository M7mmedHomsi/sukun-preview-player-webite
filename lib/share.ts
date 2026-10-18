import { cache } from "react";

/** What the Sukun `share` function returns for a code (GET /share/<code>/data). */
export interface Share {
  code: string;
  title: { en: string; ar: string };
  about: { en: string; ar: string };
  minutes: number | null;
  cover: string | null;
  colours: string[];
  audio_url: string;
  audio_expires_in: number;
  stores: { app_store: string | null; google_play: string };
}

const CODE = /^[A-Za-z0-9]{10}$/;

/** The functions' base, e.g. https://<project>.supabase.co/functions/v1 */
export function functionsUrl(): string {
  const url = process.env.SUKUN_FUNCTIONS_URL;
  if (!url) throw new Error("SUKUN_FUNCTIONS_URL is not set");
  return url.replace(/\/+$/, "");
}

/** Only the shapes the page relies on; anything else is treated as gone. */
export function parseShare(body: unknown): Share | null {
  if (!body || typeof body !== "object") return null;
  const envelope = body as { success?: unknown; data?: unknown };
  if (envelope.success !== true || !envelope.data || typeof envelope.data !== "object") return null;
  const d = envelope.data as Partial<Share>;
  if (typeof d.code !== "string" || !CODE.test(d.code)) return null;
  if (!d.title || typeof d.title.en !== "string" || typeof d.title.ar !== "string") return null;
  if (typeof d.audio_url !== "string" || !d.audio_url.startsWith("http")) return null;
  return {
    code: d.code,
    title: d.title,
    about: {
      en: typeof d.about?.en === "string" ? d.about.en : "",
      ar: typeof d.about?.ar === "string" ? d.about.ar : "",
    },
    minutes: typeof d.minutes === "number" ? d.minutes : null,
    cover: typeof d.cover === "string" && d.cover.startsWith("https://") ? d.cover : null,
    colours: Array.isArray(d.colours) ? d.colours.filter((c) => /^#[0-9a-f]{6}$/i.test(c)) : [],
    audio_url: d.audio_url,
    audio_expires_in: typeof d.audio_expires_in === "number" ? d.audio_expires_in : 0,
    stores: {
      app_store: typeof d.stores?.app_store === "string" ? d.stores.app_store : null,
      google_play:
        typeof d.stores?.google_play === "string"
          ? d.stores.google_play
          : "https://play.google.com/store/apps/details?id=ae.appzone.sukun",
    },
  };
}

/**
 * One share per request (the page and its preview tags share the call, so
 * a visit counts once). Never cached: the audio link is signed per visit.
 */
export const fetchShare = cache(async (code: string): Promise<Share | null> => {
  if (!CODE.test(code)) return null;
  const res = await fetch(`${functionsUrl()}/share/${code}/data`, { cache: "no-store" });
  if (!res.ok) return null;
  return parseShare(await res.json().catch(() => null));
});
