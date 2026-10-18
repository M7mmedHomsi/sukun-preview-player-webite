import { STRINGS, type Lang, type Platform } from "@/lib/strings";

export const PLAY_URL = "https://play.google.com/store/apps/details?id=ae.appzone.sukun";

export interface Stores {
  appStore: string | null;
  googlePlay: string;
  /** Each store's link as an inline SVG QR code, made on the server. */
  qr: { appStore: string | null; googlePlay: string };
}

/**
 * Where to get Sukun, as the app's sheet draws its actions: on a phone the
 * purple pill for that phone's store (60pt, the app's SukunSheetButton);
 * on a computer a QR code for each store, to scan with the phone.
 */
export function GetSukun({ lang, platform, stores }: { lang: Lang; platform: Platform; stores: Stores }) {
  const t = STRINGS[lang];
  if (platform === "desktop") {
    return (
      <div className="qrs">
        <Qr svg={stores.qr.appStore} store={t.appStore} device={t.iphone} soon={t.soon} />
        <Qr svg={stores.qr.googlePlay} store={t.googlePlay} device={t.android} soon={t.soon} />
        <p className="qrs-hint">{t.scan}</p>
      </div>
    );
  }
  const ios = platform === "ios";
  const url = ios ? stores.appStore : stores.googlePlay;
  const store = ios ? t.appStore : t.googlePlay;
  return url ? (
    <a className="pill pill-primary" href={url}>
      {t.getOn(store)}
    </a>
  ) : (
    <span className="pill pill-primary pill-off" aria-disabled="true">
      {t.soonOn(store)}
    </span>
  );
}

function Qr({ svg, store, device, soon }: { svg: string | null; store: string; device: string; soon: string }) {
  return (
    <figure className="qr-tile">
      {svg ? (
        <div className="qr" role="img" aria-label={`${store} QR`} dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="qr qr-soon" aria-hidden="true">
          {soon}
        </div>
      )}
      <figcaption>
        <b>{store}</b>
        <span>{device}</span>
      </figcaption>
    </figure>
  );
}
