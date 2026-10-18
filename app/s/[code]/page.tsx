import type { Metadata } from "next";
import { headers } from "next/headers";
import { fetchShare } from "@/lib/share";
import { pickLang, pickPlatform, STRINGS } from "@/lib/strings";
import { Notice } from "../../notice";
import { Player } from "../../player";
import { stores } from "../../stores";

// Every visit asks the server: the audio link is signed per visit.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

async function visitor() {
  const h = await headers();
  return { lang: pickLang(h.get("accept-language")), platform: pickPlatform(h.get("user-agent")) };
}

/** The link preview WhatsApp, iMessage and others draw: the session's
 *  name, its words and its cover. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const share = await fetchShare(code);
  const { lang } = await visitor();
  if (!share) return { title: "Sukun" };
  const title = `${share.title[lang] || share.title.en} · Sukun`;
  const description = share.about[lang] || share.about.en || STRINGS[lang].shared;
  const image = share.cover ?? "/og.png";
  return {
    title,
    description,
    openGraph: { title, description, images: [image], type: "music.song", siteName: "Sukun" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharePage({ params }: Props) {
  const { code } = await params;
  const { lang, platform } = await visitor();
  const t = STRINGS[lang];
  const share = await fetchShare(code);

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
