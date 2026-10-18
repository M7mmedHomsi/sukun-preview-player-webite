import type { Metadata } from "next";
import { headers } from "next/headers";
import { fetchShare } from "@/lib/share";
import { pickLang, STRINGS } from "@/lib/strings";
import { Player } from "../../player";
import { Brand, GetSukun } from "../../stores";

// Every visit asks the server: the audio link is signed per visit.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

const NIGHT = ["#143880", "#33337D", "#512E7A", "#0A1F5C"];

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
  const description = share.about[l] || share.about.en || STRINGS[l].shared;
  const image = share.cover ?? "/og.png";
  return {
    title,
    description,
    openGraph: { title, description, images: [image], type: "music.song", siteName: "Sukun" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** The session's own silk colours behind the page, as in the app's player. */
function stage(colours: string[], cover: string | null): React.CSSProperties {
  const [a, b, c, d] = [...colours, ...NIGHT].slice(0, 4);
  return {
    ["--c1" as string]: a,
    ["--c2" as string]: b,
    ["--c3" as string]: c,
    ["--c4" as string]: d,
    ["--cover" as string]: cover ? `url("${cover}")` : "none",
  };
}

export default async function SharePage({ params }: Props) {
  const { code } = await params;
  const l = await lang();
  const t = STRINGS[l];
  const share = await fetchShare(code);

  if (!share) {
    return (
      <div className="stage" style={stage([], null)}>
        <Brand />
        <main className="gone">
          <h1>{t.gone}</h1>
          <p className="about">{t.gone2}</p>
        </main>
        <GetSukun t={t} appStore={process.env.APP_STORE_URL} />
      </div>
    );
  }

  const title = share.title[l] || share.title.en;
  const about = share.about[l] || share.about.en;
  return (
    <div className="stage" style={stage(share.colours, share.cover)}>
      <Brand />
      <main className="session">
        <p className="shared">{t.shared}</p>
        {share.cover ? (
          <img className="art" src={share.cover} alt="" />
        ) : (
          <div className="art art-silk" aria-hidden="true" />
        )}
        <h1>{title}</h1>
        {share.minutes ? <p className="minutes">{t.minutes(share.minutes)}</p> : null}
        {about ? <p className="about">{about}</p> : null}
        {share.stream_url ? (
          <Player stream={share.stream_url} labels={{ play: t.play, pause: t.pause, seek: t.seek }} />
        ) : (
          <p className="app-only">{t.appOnly}</p>
        )}
      </main>
      <GetSukun t={t} appStore={share.stores.app_store} googlePlay={share.stores.google_play} />
    </div>
  );
}
