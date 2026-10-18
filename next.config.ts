import type { NextConfig } from "next";

// The page loads its own files, the session's cover, and the encrypted
// stream (playlist, key, pieces) from the Sukun project. Locally the
// project is another origin (SUKUN_FUNCTIONS_URL), so it is allowed too.
const SUPABASE = "https://*.supabase.co";
const project = (() => {
  try {
    return new URL(process.env.SUKUN_FUNCTIONS_URL ?? "").origin;
  } catch {
    return "";
  }
})();
const sources = [SUPABASE, project].filter((s, i, all) => s && all.indexOf(s) === i).join(" ");

const config: NextConfig = {
  // A second build folder for local checks while another build is serving.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `img-src 'self' data: ${sources}`,
              // hls.js feeds the decrypted audio through a blob: MediaSource.
              `media-src 'self' blob: ${sources}`,
              `connect-src 'self' ${sources}`,
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "base-uri 'none'",
              "form-action 'none'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default config;
