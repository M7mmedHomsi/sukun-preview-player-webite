import { describe, expect, it } from "vitest";
import { parseShare } from "../lib/share";
import { formatHertz, pickLang, pickPlatform } from "../lib/strings";

const good = {
  success: true,
  data: {
    code: "UHY8Ggs6fj",
    title: { en: "Belly Breathing", ar: "التنفس البطني" },
    about: { en: "Slow breaths.", ar: "أنفاس بطيئة." },
    minutes: 10,
    cover: "https://abc.supabase.co/storage/v1/object/public/covers/a.webp",
    colours: ["#3067D4", "not-a-colour"],
    stream_url: "https://abc.supabase.co/functions/v1/share/UHY8Ggs6fj/play.m3u8?t=1800000000.abc",
    stream_expires_in: 1800,
    preview_minutes: 5,
    look: { kind: "silk", pattern: "orbs", seed: 12.345, colours: ["#112233", "#445566", "#778899", "#AABBCC"], photo: null },
    voiced: true,
    hertz: null,
    stores: { app_store: null, google_play: "https://play.google.com/store/apps/details?id=ae.appzone.sukun" },
  },
};

describe("parseShare", () => {
  it("keeps a well-formed share", () => {
    const share = parseShare(good);
    expect(share?.title.ar).toBe("التنفس البطني");
    expect(share?.minutes).toBe(10);
    expect(share?.preview_minutes).toBe(5);
    expect(share?.colours).toEqual(["#3067D4"]);
  });

  it("treats a failed or malformed answer as gone", () => {
    expect(parseShare({ success: false, data: null })).toBeNull();
    expect(parseShare({ success: true, data: { ...good.data, code: "../etc" } })).toBeNull();
    expect(parseShare("nope")).toBeNull();
  });

  it("keeps only a playlist address as the stream, never a file", () => {
    expect(parseShare(good)?.stream_url).toContain("/play.m3u8?t=");
    expect(parseShare({ ...good, data: { ...good.data, stream_url: "https://abc.supabase.co/audio/a.m4a" } })?.stream_url).toBeNull();
    expect(parseShare({ ...good, data: { ...good.data, stream_url: "javascript:alert(1)" } })?.stream_url).toBeNull();
    expect(parseShare({ ...good, data: { ...good.data, stream_url: null } })?.stream_url).toBeNull();
  });

  it("keeps the app player's look, else Sukun's default silk", () => {
    expect(parseShare(good)?.look).toEqual(good.data.look);
    const odd = parseShare({ ...good, data: { ...good.data, look: { kind: "photo", pattern: "new", seed: "x", colours: ["red"], photo: "http://x" } } });
    expect(odd?.look.kind).toBe("silk");
    expect(odd?.look.pattern).toBe("silk");
    expect(odd?.look.seed).toBe(0);
    expect(odd?.look.colours).toHaveLength(4);
    const photo = parseShare({ ...good, data: { ...good.data, look: { ...good.data.look, kind: "photo", photo: "https://x/c.jpg" } } });
    expect(photo?.look.photo).toBe("https://x/c.jpg");
    expect(parseShare({ ...good, data: { ...good.data, look: undefined } })?.look.pattern).toBe("silk");
  });

  it("knows a Sleep Frequency's Hz and that it has no narrator", () => {
    const f = parseShare({ ...good, data: { ...good.data, voiced: false, hertz: 432 } });
    expect(f?.voiced).toBe(false);
    expect(f?.hertz).toBe(432);
    expect(parseShare(good)?.voiced).toBe(true);
    expect(formatHertz(432)).toBe("432");
    expect(formatHertz(7.83)).toBe("7.83");
  });

  it("drops a cover that is not https", () => {
    expect(parseShare({ ...good, data: { ...good.data, cover: "http://x/a.png" } })?.cover).toBeNull();
  });
});

describe("pickPlatform", () => {
  it("offers the visitor's own store, both on a computer", () => {
    expect(pickPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe("ios");
    expect(pickPlatform("Mozilla/5.0 (Linux; Android 15; Pixel 9)")).toBe("android");
    expect(pickPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");
  });
});

describe("pickLang", () => {
  it("is Arabic when the browser's first language is Arabic", () => {
    expect(pickLang("ar-AE,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(pickLang("en-GB,ar;q=0.5")).toBe("en");
    expect(pickLang(null)).toBe("en");
  });
});
