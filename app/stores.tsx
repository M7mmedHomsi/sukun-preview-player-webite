import QRCode from "qrcode";
import type { Strings } from "@/lib/strings";

export const PLAY_URL = "https://play.google.com/store/apps/details?id=ae.appzone.sukun";

/** The store link as an inline SVG QR code (made on the server). */
async function qr(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#1E163FFF", light: "#FFFFFF00" },
  });
}

async function Store({ url, store, device, t }: { url: string | null; store: string; device: string; t: Strings }) {
  if (!url) {
    return (
      <div className="store soon">
        <div className="qr qr-empty" aria-hidden="true">
          <span>{t.soon}</span>
        </div>
        <p className="store-name">{store}</p>
        <p className="store-device">{device}</p>
      </div>
    );
  }
  const svg = await qr(url);
  return (
    <div className="store">
      <div className="qr" role="img" aria-label={`${store} QR`} dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="store-name">{store}</p>
      <p className="store-device">{device}</p>
      <a className="store-open" href={url}>
        {t.open} {store}
      </a>
    </div>
  );
}

/** "Get Sukun": a QR code for each store, with a button for phone visitors. */
export async function GetSukun({
  t,
  appStore,
  googlePlay = PLAY_URL,
}: {
  t: Strings;
  appStore?: string | null;
  googlePlay?: string;
}) {
  return (
    <section className="get">
      <h2>{t.getTitle}</h2>
      <p className="get-body">{t.getBody}</p>
      <div className="stores">
        <Store url={appStore ?? null} store={t.appStore} device={t.iphone} t={t} />
        <Store url={googlePlay} store={t.googlePlay} device={t.android} t={t} />
      </div>
    </section>
  );
}

/** The Sukun mark at the top of every page. */
export function Brand() {
  return (
    <header className="brand">
      <img src="/icon.png" alt="" width={32} height={32} />
      <span>Sukun</span>
      <span className="brand-ar">سُكون</span>
    </header>
  );
}
