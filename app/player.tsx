"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Look } from "@/lib/share";
import { formatHertz, STRINGS, type Lang, type Platform } from "@/lib/strings";
import { Backdrop } from "./backdrop";
import { GetSukun, type Stores } from "./get-sukun";
import { Ring } from "./ring";
import { Sheet } from "./sheet";

export interface Session {
  title: string;
  about: string;
  minutes: number | null;
  previewMinutes: number | null;
  look: Look;
  voiced: boolean;
  hertz: number | null;
  cover: string | null;
  /** The encrypted HLS playlist; null when the session plays only in the app. */
  stream: string | null;
}

type SheetKind = "end" | "ask" | "about" | null;

const SKIP = 10;

/**
 * The app's player screen (PlayerScreen, Figma 458:9015), on the web: the
 * session's own backdrop, the nav, the ring with the title in it, the
 * description, the transport and the actions row, in the app's sizes.
 *
 * The audio is the encrypted HLS preview (AES-128 pieces, the key behind
 * this visit's token; client 2026-10-18: "they shouldn't download it").
 * hls.js plays it where the browser can't play HLS itself (Chrome,
 * Firefox); iPhone and Safari play it natively. The browser's own controls
 * (their menu offers "Download") are never shown. When the preview ends,
 * the app's sheet asks them to continue in Sukun (client 2026-10-19).
 */
export function Player({
  session,
  lang,
  platform,
  stores,
}: {
  session: Session;
  lang: Lang;
  platform: Platform;
  stores: Stores;
}) {
  const t = STRINGS[lang];
  const rtl = lang === "ar";
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [wantsSound, setWantsSound] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { stream } = session;
  const previewEnds = Boolean(
    session.previewMinutes && session.minutes && session.previewMinutes < session.minutes,
  );

  useEffect(() => {
    const a = audio.current;
    if (!a || !stream) return;
    let hls: { destroy(): void } | null = null;
    let cancelled = false;
    (async () => {
      const { default: Hls } = await import("hls.js");
      if (cancelled) return;
      if (Hls.isSupported()) {
        const h = new Hls({ enableWorker: true, maxBufferLength: 30 });
        h.loadSource(stream);
        h.attachMedia(a);
        hls = h;
      } else if (a.canPlayType("application/vnd.apple.mpegurl")) {
        a.src = stream;
      }
    })();
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [stream]);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const on: Record<string, () => void> = {
      timeupdate: () => setTime(a.currentTime),
      loadedmetadata: () => setDuration(Number.isFinite(a.duration) ? a.duration : 0),
      durationchange: () => setDuration(Number.isFinite(a.duration) ? a.duration : 0),
      play: () => {
        setPlaying(true);
        setWantsSound(true);
      },
      playing: () => setWaiting(false),
      waiting: () => setWaiting(true),
      pause: () => {
        setPlaying(false);
        setWantsSound(false);
        setWaiting(false);
      },
      ended: () => {
        setPlaying(false);
        setWantsSound(false);
        setSheet("end");
      },
    };
    for (const [name, fn] of Object.entries(on)) a.addEventListener(name, fn);
    return () => {
      for (const [name, fn] of Object.entries(on)) a.removeEventListener(name, fn);
    };
  }, []);

  // The lock screen and the notification name the session, as the app's do.
  useEffect(() => {
    if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: session.title,
      artist: "Sukun",
      album: "Sukun",
      artwork: [{ src: session.cover ?? "/icon.png" }],
    });
  }, [session.title, session.cover]);

  const toggle = () => {
    const a = audio.current;
    if (!stream || !a) {
      setSheet("ask");
      return;
    }
    if (a.paused) {
      setWantsSound(true);
      setWaiting(true);
      void a.play().catch(() => {
        setWantsSound(false);
        setWaiting(false);
      });
    } else a.pause();
  };

  const seek = useCallback(
    (seconds: number) => {
      const a = audio.current;
      if (!a || !duration) return;
      const to = Math.min(Math.max(seconds, 0), duration);
      a.currentTime = to;
      setTime(to);
    },
    [duration],
  );

  const listenAgain = () => {
    setSheet(null);
    seek(0);
    void audio.current?.play();
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: session.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast(t.copied);
      window.setTimeout(() => setToast(null), 2200);
    } catch {
      // Dismissed: nothing to say.
    }
  };

  const remaining = duration ? duration - time : (session.previewMinutes ?? 0) * 60;
  const hertz = session.hertz ? t.hertz(formatHertz(session.hertz)) : null;

  return (
    <div className="screen">
      <Backdrop look={session.look} />
      <div className="column" onContextMenu={(e) => e.preventDefault()}>
        <nav className="nav">
          <span className="circle brand-circle" aria-hidden="true">
            <img src="/icon.png" alt="" width={40} height={40} />
          </span>
          <span className="nav-title">{session.voiced ? t.voiceover : ""}</span>
          <button type="button" className="circle" aria-label={t.favourite} onClick={() => setSheet("ask")}>
            <img src="/icons/fav.svg" alt="" width={24} height={24} />
          </button>
        </nav>

        <div className="grow" />
        <Ring
          progress={duration ? time / duration : 0}
          remaining={remaining}
          rtl={rtl}
          label={t.seek}
          onSeek={stream && duration ? (fraction) => seek(fraction * duration) : undefined}
          onStep={(by) => seek(time + by)}
        >
          <h1 className="ring-title">{session.title}</h1>
        </Ring>
        {hertz ? <p className="hz">{hertz}</p> : null}
        {session.about ? (
          <p className={`about-line${hertz ? " after-hz" : ""}`}>{session.about}</p>
        ) : null}

        <div className="transport" dir="ltr">
          <button type="button" className="glass" aria-label={t.back10} onClick={() => seek(time - SKIP)}>
            <img src="/icons/back_10s.svg" alt="" width={32} height={32} />
          </button>
          <button
            type="button"
            className={`play${waiting && wantsSound ? " waiting" : ""}`}
            aria-label={wantsSound || playing ? t.pause : t.play}
            onClick={toggle}
          >
            <img src={wantsSound || playing ? "/icons/pause.svg" : "/icons/play.svg"} alt="" width={40} height={40} />
          </button>
          <button type="button" className="glass" aria-label={t.forward10} onClick={() => seek(time + SKIP)}>
            <img src="/icons/forward_10s.svg" alt="" width={32} height={32} />
          </button>
        </div>
        <div className="grow" />

        {stream && previewEnds ? (
          <p className="preview-pill">{t.preview(session.previewMinutes!, session.minutes!)}</p>
        ) : !stream ? (
          <p className="preview-pill">{t.appOnly}</p>
        ) : null}
        <div className="actions">
          {session.about ? (
            <button type="button" className="action" onClick={() => setSheet("about")}>
              <span className="glyph" style={{ ["--icon" as string]: "url(/icons/info_24.svg)" }} />
              <span>{t.description}</span>
            </button>
          ) : null}
          <button type="button" className="action" onClick={() => setSheet("ask")}>
            <span className="glyph" style={{ ["--icon" as string]: "url(/icons/download.svg)" }} />
            <span>{t.getApp}</span>
          </button>
          <button type="button" className="action" onClick={share}>
            <span className="glyph" style={{ ["--icon" as string]: "url(/icons/share_new.svg)" }} />
            <span>{t.share}</span>
          </button>
        </div>
      </div>

      {toast ? (
        <p className="toast" role="status">
          {toast}
        </p>
      ) : null}

      <Sheet
        open={sheet === "about"}
        onClose={() => setSheet(null)}
        title={session.title}
        body={session.about}
        closeLabel={t.close}
      />
      <Sheet
        open={sheet === "end" || sheet === "ask"}
        onClose={() => setSheet(null)}
        title={sheet === "end" && session.previewMinutes ? t.endTitle(session.previewMinutes) : t.askTitle}
        body={sheet === "end" ? t.endBody : t.askBody}
        closeLabel={t.close}
        icon={<img className="sheet-icon" src="/icon.png" alt="" width={72} height={72} />}
      >
        <div className="sheet-actions">
          <GetSukun lang={lang} platform={platform} stores={stores} />
          {sheet === "end" ? (
            <button type="button" className="pill pill-secondary" onClick={listenAgain}>
              {t.listenAgain}
            </button>
          ) : (
            <button type="button" className="pill pill-secondary" onClick={() => setSheet(null)}>
              {t.notNow}
            </button>
          )}
        </div>
      </Sheet>

      {/* No `controls`: nothing of the browser's own player is ever shown. */}
      <audio
        ref={audio}
        preload="metadata"
        controlsList="nodownload noplaybackrate noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
