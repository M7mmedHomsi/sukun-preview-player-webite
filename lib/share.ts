import { cache } from "react";
import { isPattern, type Pattern } from "./shaders/patterns";

/** How the app's player draws the session behind its controls. */
export interface Look {
  kind: "silk" | "photo";
  pattern: Pattern;
  seed: number;
  /** Four #rrggbb stops, low → high. */
  colours: string[];
  photo: string | null;
}

/** Sukun's blue → lavender silk, the app's default. */
export const DEFAULT_LOOK: Look = {
  kind: "silk",
  pattern: "silk",
  seed: 0,
  colours: ["#3067D4", "#6972CF", "#A27DCB", "#EBDFFF"],
  photo: null,
};

const HEX = /^#[0-9a-f]{6}$/i;

function parseLook(raw: unknown): Look {
  if (!raw || typeof raw !== "object") return DEFAULT_LOOK;
  const l = raw as Partial<Look>;
  const colours =
    Array.isArray(l.colours) && l.colours.length === 4 && l.colours.every((c) => typeof c === "string" && HEX.test(c))
      ? l.colours
      : DEFAULT_LOOK.colours;
  const photo = typeof l.photo === "string" && l.photo.startsWith("https://") ? l.photo : null;
  return {
    kind: l.kind === "photo" && photo ? "photo" : "silk",
    pattern: isPattern(l.pattern) ? l.pattern : "silk",
    seed: typeof l.seed === "number" && Number.isFinite(l.seed) ? l.seed : 0,
    colours,
    photo,
  };
}

/** What the Sukun `share` function returns for a code (GET /share/<code>/data). */
export interface Share {
  code: string;
  title: { en: string; ar: string };
  about: { en: string; ar: string };
  minutes: number | null;
  cover: string | null;
  colours: string[];
  /** The encrypted HLS playlist (a short-lived token in it); null when the
   *  session has no encrypted rendition yet: the page then points to the app. */
  stream_url: string | null;
  /** How much the web plays; the whole session is in the app. */
  preview_minutes: number | null;
  look: Look;
  /** A narrated session (the app's "Voiceover" title); false for
   *  Sleep Frequencies and White Sounds. */
  voiced: boolean;
  hertz: number | null;
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
  const stream =
    typeof d.stream_url === "string" && /^https?:\/\/[^\s"]+\/play\.m3u8\?t=/.test(d.stream_url)
      ? d.stream_url
      : null;
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
    stream_url: stream,
    preview_minutes: typeof d.preview_minutes === "number" ? d.preview_minutes : null,
    look: parseLook(d.look),
    voiced: d.voiced !== false,
    hertz: typeof d.hertz === "number" && d.hertz > 0 ? d.hertz : null,
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
 * a visit counts once). Never cached: the stream token is made per visit.
 */
export const fetchShare = cache(async (code: string): Promise<Share | null> => {
  if (!CODE.test(code)) return null;
  const res = await fetch(`${functionsUrl()}/share/${code}/data`, { cache: "no-store" });
  if (!res.ok) return null;
  return parseShare(await res.json().catch(() => null));
});
