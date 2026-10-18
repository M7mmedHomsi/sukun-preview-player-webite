import { headers } from "next/headers";
import { pickLang, STRINGS } from "@/lib/strings";
import { Brand, GetSukun } from "./stores";

/** The bare address: what Sukun is, and where to get it. */
export default async function Home() {
  const t = STRINGS[pickLang((await headers()).get("accept-language"))];
  return (
    <div className="stage">
      <Brand />
      <main className="gone">
        <img className="logo" src="/icon.png" alt="" />
        <h1>Sukun · سُكون</h1>
        <p className="about">{t.home}</p>
      </main>
      <GetSukun t={t} appStore={process.env.APP_STORE_URL} />
    </div>
  );
}
