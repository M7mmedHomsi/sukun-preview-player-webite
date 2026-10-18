import { describe, expect, it } from "vitest";
import { parseShare } from "../lib/share";
import { pickLang } from "../lib/strings";

const good = {
  success: true,
  data: {
    code: "UHY8Ggs6fj",
    title: { en: "Belly Breathing", ar: "التنفس البطني" },
    about: { en: "Slow breaths.", ar: "أنفاس بطيئة." },
    minutes: 10,
    cover: "https://abc.supabase.co/storage/v1/object/public/covers/a.webp",
    colours: ["#3067D4", "not-a-colour"],
    audio_url: "https://abc.supabase.co/storage/v1/object/sign/audio/a.m4a?token=t",
    audio_expires_in: 7200,
    stores: { app_store: null, google_play: "https://play.google.com/store/apps/details?id=ae.appzone.sukun" },
  },
};

describe("parseShare", () => {
  it("keeps a well-formed share", () => {
    const share = parseShare(good);
    expect(share?.title.ar).toBe("التنفس البطني");
    expect(share?.minutes).toBe(10);
    expect(share?.colours).toEqual(["#3067D4"]);
  });

  it("treats a failed or malformed answer as gone", () => {
    expect(parseShare({ success: false, data: null })).toBeNull();
    expect(parseShare({ success: true, data: { ...good.data, code: "../etc" } })).toBeNull();
    expect(parseShare({ success: true, data: { ...good.data, audio_url: "javascript:alert(1)" } })).toBeNull();
    expect(parseShare("nope")).toBeNull();
  });

  it("drops a cover that is not https", () => {
    expect(parseShare({ ...good, data: { ...good.data, cover: "http://x/a.png" } })?.cover).toBeNull();
  });
});

describe("pickLang", () => {
  it("is Arabic when the browser's first language is Arabic", () => {
    expect(pickLang("ar-AE,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(pickLang("en-GB,ar;q=0.5")).toBe("en");
    expect(pickLang(null)).toBe("en");
  });
});
