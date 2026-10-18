import { headers } from "next/headers";
import { pickLang, pickPlatform, STRINGS } from "@/lib/strings";
import { Notice } from "./notice";
import { stores } from "./stores";

/** The bare address: what Sukun is, and where to get it. */
export default async function Home() {
  const h = await headers();
  const lang = pickLang(h.get("accept-language"));
  return (
    <Notice
      lang={lang}
      platform={pickPlatform(h.get("user-agent"))}
      stores={await stores(process.env.APP_STORE_URL)}
      title="Sukun · سُكون"
      body={STRINGS[lang].home}
    />
  );
}
