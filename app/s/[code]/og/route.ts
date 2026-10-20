import sharp from "sharp";
import { DEFAULT_LOOK, fetchCard } from "@/lib/share";

/**
 * The link's preview picture (client 2026-10-20: "when I share a VO, show a
 * big picture, like the square inside the app"): 1200 x 630, the size
 * WhatsApp, iMessage and Telegram show large. The session's square art,
 * big, over the same art blurred (or its colours), and the Sukun icon in
 * the corner. No text: the preview prints the name under the picture, and
 * Arabic would need shaping an image library doesn't do.
 *
 * Reads the share's card, which counts no view.
 */
export const runtime = "nodejs";

const W = 1200;
const H = 630;
const ART = 470;
const RADIUS = 44;
const ICON = 72;

async function image(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** The session's four colours as a soft gradient, for art it doesn't have. */
function gradient(colours: readonly string[], width: number, height: number): Buffer {
  const [a, b, c, d] = colours;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<defs>` +
      `<linearGradient id="base" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${b}"/><stop offset="0.55" stop-color="${a}"/><stop offset="1" stop-color="${c}"/>` +
      `</linearGradient>` +
      `<radialGradient id="glow" cx="25%" cy="20%" r="80%">` +
      `<stop offset="0" stop-color="${d}" stop-opacity="0.75"/><stop offset="1" stop-color="${d}" stop-opacity="0"/>` +
      `</radialGradient>` +
      `</defs>` +
      `<rect width="100%" height="100%" fill="url(#base)"/>` +
      `<rect width="100%" height="100%" fill="url(#glow)"/>` +
      `</svg>`,
  );
}

function rounded(size: number, radius: number, fill = "#fff", opacity = 1): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${fill}" fill-opacity="${opacity}"/>` +
      `</svg>`,
  );
}

async function square(source: Buffer, size: number, radius: number): Promise<Buffer> {
  return sharp(source)
    .resize(size, size, { fit: "cover" })
    .composite([{ input: rounded(size, radius), blend: "dest-in" }])
    .png()
    .toBuffer();
}

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const share = await fetchCard(code);
  const colours = share?.look.colours ?? DEFAULT_LOOK.colours;
  const artUrl = share ? share.look.photo ?? share.cover : null;
  const art = artUrl ? await image(artUrl) : null;

  const background = art
    ? await sharp(art)
        .resize(W, H, { fit: "cover" })
        .blur(36)
        .modulate({ brightness: 0.78 })
        .png()
        .toBuffer()
    : await sharp(gradient(colours, W, H)).png().toBuffer();
  const front = await square(art ?? gradient(colours, ART, ART), ART, RADIUS);

  // A soft shadow under the square, so it lifts off the blur. sharp
  // composites last whatever the call order, so the shape is drawn first
  // and blurred in a second pass.
  const pad = 60;
  const shape = await sharp({
    create: { width: ART + pad * 2, height: ART + pad * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: rounded(ART, RADIUS, "#000", 0.5), left: pad, top: pad }])
    .png()
    .toBuffer();
  const shadow = await sharp(shape).blur(24).png().toBuffer();

  const layers: sharp.OverlayOptions[] = [
    { input: shadow, left: (W - ART) / 2 - pad, top: (H - ART) / 2 - pad + 14 },
    { input: front, left: (W - ART) / 2, top: (H - ART) / 2 },
  ];
  const icon = await image(new URL("/og-icon.png", req.url).toString());
  if (icon) {
    layers.push({ input: await square(icon, ICON, 18), left: W - ICON - 36, top: H - ICON - 36 });
  }

  // JPEG: WhatsApp drops a preview picture over about 300 KB.
  const jpeg = await sharp(background).composite(layers).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
