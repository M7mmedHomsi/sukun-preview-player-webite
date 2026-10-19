# Sukun preview player

The public page that opens when someone shares a session from the Sukun app, for example `https://<this site>/s/UHY8Ggs6fj`. It looks like the app's player screen:

- the session's own moving background (the app's silk shaders), or the cover photo for Sleep Frequencies and White Sounds;
- the app's ring, play button and fonts, in Arabic or English to match the visitor's browser.

A visitor can listen to a **5-minute preview**. When it ends, the app's sheet asks them to get Sukun: on a phone it shows the button for that phone's store, and on a computer it shows QR codes. WhatsApp, iMessage and similar apps show the session's name and cover in the link preview.

## How the audio is protected

- The page never gets an audio file. It plays an encrypted HLS stream (AES-128): the Sukun `share` function lists only the first 5 minutes of encrypted pieces, each on a short-lived signed link.
- The key is handed out only with a short-lived token bound to that link.
- The browser's own player (whose menu offers "Download") is never shown.
- Each link opens at most 50 times.

Each visit asks the function for the session (`GET /functions/v1/share/<code>/data`), which counts one view.

The page lives on its own website because Supabase serves a server function's HTML as plain text on `supabase.co`.

## Run it

```bash
npm install
cp .env.example .env.local      # point SUKUN_FUNCTIONS_URL at the project
npm run dev                     # http://localhost:3000/s/<code>
npm test
```

## Settings (environment variables)

| Name | Example | What it is |
|---|---|---|
| `SUKUN_FUNCTIONS_URL` | `https://xrxztpcijkhehrrpneve.supabase.co/functions/v1` | Required. The Sukun project's server functions. Not a secret. |
| `SITE_URL` | `https://share.example.com` | Optional. The site's own address, used for full links in previews. On Vercel it defaults to the production address. |
| `APP_STORE_URL` | `https://apps.apple.com/app/id…` | Optional. The App Store button on the home and "link ran out" pages. Until it is set, that button says "Coming soon". |

## Put it online (Vercel)

1. In Vercel, go to **Add New → Project → Import** and pick this repository. Vercel detects Next.js; keep the defaults.
2. Under **Settings → Environment Variables**, add `SUKUN_FUNCTIONS_URL`, then deploy.
3. Optional: under **Settings → Domains**, add a domain such as `share.<your-domain>` and set the DNS record Vercel shows.
4. Tell the Sukun backend where the page lives: on the Supabase project, set the secret `SHARE_PAGE_URL` to the site's address, then deploy the `share` function again with `--no-verify-jwt`. New links then point at this site, and old links forward to it.

Vercel's free (Hobby) plan is for non-commercial use only. A business site needs the Pro plan.

## Licences

Inter, Inter Tight and IBM Plex Sans Arabic are under the SIL Open Font License. The silk's noise is MIT. See `THIRD_PARTY_NOTICES.md`.
