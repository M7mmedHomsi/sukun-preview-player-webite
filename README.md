# sukun-share

The public page that a shared Sukun session opens, for example `https://<this site>/s/UHY8Ggs6fj`. A friend who isn't on Sukun gets:

- the session's cover, name and description;
- a player for that one session;
- the App Store and Google Play buttons.

Link previews in WhatsApp, iMessage and similar apps show the session's name and cover.

The app makes the link through the Sukun `share` server function. Each time the page opens, it asks that function for the session (`GET /functions/v1/share/<code>/data`). The function answers with a fresh audio link signed for two hours, and counts the view. The audio itself stays private.

This page lives on its own website because Supabase serves any page a server function returns as plain text on its own `supabase.co` address (see the Supabase changelog, "XHTML responses are only allowed with a Custom Domain enabled").

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
| `SUKUN_FUNCTIONS_URL` | `https://xrxztpcijkhehrrpneve.supabase.co/functions/v1` | The Sukun project's server functions. Not a secret. |
| `SITE_URL` | `https://share.example.com` | Optional. The site's own address, used for full links in previews. On Vercel it defaults to the production address. |
| `APP_STORE_URL` | `https://apps.apple.com/app/id…` | Optional. The App Store button on the home and "link ran out" pages; the session page takes it from the function. |

## Put it online (Vercel)

1. In Vercel: **Add New → Project → Import** this repository. Vercel detects Next.js; keep the defaults.
2. Add `SUKUN_FUNCTIONS_URL` under **Settings → Environment Variables**, then deploy.
3. Optional: **Settings → Domains**. Add a domain such as `share.<your-domain>` and set the DNS record Vercel shows.
4. Tell the Sukun backend where the page lives. On the Supabase project, set the secret `SHARE_PAGE_URL` to the site's address (for example `https://share.<your-domain>`), then deploy the `share` function again with `--no-verify-jwt`. New links then point at this site, and old links forward to it.

## Licences

Inter and IBM Plex Sans Arabic are under the SIL Open Font License; see `THIRD_PARTY_NOTICES.md`.
