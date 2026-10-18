import type { Metadata } from "next";
import { headers } from "next/headers";
import { fetchShare } from "@/lib/share";
import { pickLang, STRINGS } from "@/lib/strings";
import { Stores } from "../../stores";

// Every visit asks the server: the audio link is signed per visit.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

async function lang() {
  return pickLang((await headers()).get("accept-language"));
}

/** The link preview WhatsApp, iMessage and others draw: the session's
 *  name, its words and its cover. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const share = await fetchShare(code);
  const l = await lang();
  if (!share) return { title: "Sukun" };
  const title = `${share.title[l] || share.title.en} · Sukun`;
  const description = share.about[l] || share.about.en || STRINGS[l].from;
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
  const l = await lang();
  const t = STRINGS[l];
  const share = await fetchShare(code);

  if (!share) {
    return (
      <main className="card">
        <img className="logo" src="/icon.png" alt="" />
        <h1 style={{ marginTop: 16 }}>{t.gone}</h1>
        <p className="about">{t.gone2}</p>
        <p className="get">{t.get}</p>
        <Stores appStore={process.env.APP_STORE_URL} />
      </main>
    );
  }

  const title = share.title[l] || share.title.en;
  const about = share.about[l] || share.about.en;
  const colours = share.colours.length ? share.colours : ["#3067D4", "#6972CF", "#A27DCB"];
  return (
    <main className="card">
      {share.cover ? (
        <img className="art" src={share.cover} alt="" />
      ) : (
        <div className="art" style={{ background: `linear-gradient(135deg, ${colours.join(", ")})` }} />
      )}
      <p className="from">{t.from}</p>
      <h1>{title}</h1>
      {share.minutes ? <p className="minutes">{t.minutes(share.minutes)}</p> : null}
      {about ? <p className="about">{about}</p> : null}
      <audio controls preload="none" src={share.audio_url} />
      <p className="get">{t.get}</p>
      <Stores appStore={share.stores.app_store} googlePlay={share.stores.google_play} />
    </main>
  );
}
