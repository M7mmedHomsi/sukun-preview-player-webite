import type { NextConfig } from "next";

// The page loads nothing but its own files, the session's cover and its
// audio from Supabase storage.
const SUPABASE = "https://*.supabase.co";

const config: NextConfig = {
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
              `img-src 'self' data: ${SUPABASE}`,
              `media-src ${SUPABASE}`,
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
