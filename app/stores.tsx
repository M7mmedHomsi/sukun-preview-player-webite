import QRCode from "qrcode";
import { PLAY_URL, type Stores } from "./get-sukun";

/** The store link as an inline SVG QR code (made on the server). */
async function qr(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#000000FF", light: "#FFFFFF00" },
  });
}

/** Both stores' links and QR codes; the App Store's once it exists. */
export async function stores(appStore?: string | null, googlePlay: string = PLAY_URL): Promise<Stores> {
  const apple = appStore || null;
  return {
    appStore: apple,
    googlePlay,
    qr: { appStore: apple ? await qr(apple) : null, googlePlay: await qr(googlePlay) },
  };
}
