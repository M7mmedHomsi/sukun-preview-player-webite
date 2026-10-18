"use client";

import { useEffect, useRef, useState } from "react";

type Labels = { play: string; pause: string; seek: string };

function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/**
 * Sukun's own player for the shared session, streaming the encrypted HLS
 * rendition (client 2026-10-18: "it should be encrypted ... they shouldn't
 * download it"). The audio arrives as AES-128 pieces; the key comes from
 * the share function only with this visit's short-lived token. There is no
 * file to save, and the browser's own controls (their menu offers
 * "Download") are never shown. hls.js plays it where the browser can't
 * play HLS itself (Chrome, Firefox); iPhone and Safari play it natively.
 */
export function Player({ stream, labels }: { stream: string; labels: Labels }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
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
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onPause);
    };
  }, []);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  const seek = (value: number) => {
    const a = audio.current;
    if (!a || !Number.isFinite(value)) return;
    a.currentTime = value;
    setTime(value);
  };

  return (
    <div className="player" onContextMenu={(e) => e.preventDefault()}>
      <input
        type="range"
        className="seek"
        min={0}
        max={duration || 0}
        step={1}
        value={Math.min(time, duration || 0)}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label={labels.seek}
        disabled={!duration}
        dir="ltr"
        style={{ ["--done" as string]: duration ? `${(Math.min(time, duration) / duration) * 100}%` : "0%" }}
      />
      <div className="times" dir="ltr">
        <span>{clock(time)}</span>
        <span>{clock(duration)}</span>
      </div>
      <button type="button" className="play" onClick={toggle} aria-label={playing ? labels.pause : labels.play}>
        {playing ? (
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" />
          </svg>
        )}
      </button>
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
