import type { Metadata } from "next";
import { headers } from "next/headers";
import { fetchCard, fetchShare } from "@/lib/share";
import { isPreviewBot, pickLang, pickPlatform, STRINGS } from "@/lib/strings";
import { Notice } from "../../notice";
import { Player } from "../../player";
import { stores } from "../../stores";

// Every visit asks the server: the audio link is signed per visit.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

async function visitor() {
  const h = await headers();
  const ua = h.get("user-agent");
  return { lang: pickLang(h.get("accept-language")), platform: pickPlatform(ua), bot: isPreviewBot(ua) };
}

/** The link preview WhatsApp, iMessage and others draw: the session's
 *  name, its words, and a big picture of its square art (./og). Read from
 *  the share's card, which counts no view. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const share = await fetchCard(code);
  const { lang } = await visitor();
  if (!share) return { title: "Sukun" };
  const title = `${share.title[lang] || share.title.en} · Sukun`;
  const description = share.about[lang] || share.about.en || STRINGS[lang].shared;
  const image = { url: `/s/${share.code}/og`, width: 1200, height: 630, alt: title, type: "image/jpeg" };
  return {
    title,
    description,
    openGraph: { title, description, images: [image], type: "music.song", siteName: "Sukun" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharePage({ params }: Props) {
  const { code } = await params;
  const { lang, platform, bot } = await visitor();
  const t = STRINGS[lang];
  // A bot drawing a preview gets the card: no stream, no view counted.
  const share = bot ? await fetchCard(code) : await fetchShare(code);

  if (!share) {
    return (
      <Notice
        lang={lang}
        platform={platform}
        stores={await stores(process.env.APP_STORE_URL)}
        title={t.gone}
        body={t.gone2}
      />
    );
  }

  return (
    <Player
      lang={lang}
      platform={platform}
      stores={await stores(share.stores.app_store, share.stores.google_play)}
      session={{
        title: share.title[lang] || share.title.en,
        about: share.about[lang] || share.about.en,
        minutes: share.minutes,
        previewMinutes: share.preview_minutes,
        look: share.look,
        voiced: share.voiced,
        hertz: share.hertz,
        cover: share.cover,
        stream: share.stream_url,
      }}
    />
  );
}
