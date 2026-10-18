import { headers } from "next/headers";
import { pickLang, STRINGS } from "@/lib/strings";
import { Stores } from "./stores";

/** The bare address: what Sukun is, and where to get it. */
export default async function Home() {
  const t = STRINGS[pickLang((await headers()).get("accept-language"))];
  return (
    <main className="card">
      <img className="logo" src="/icon.png" alt="" />
      <h1 style={{ marginTop: 16 }}>Sukun · سُكون</h1>
      <p className="about">{t.home}</p>
      <p className="get">{t.get}</p>
      <Stores appStore={process.env.APP_STORE_URL} />
    </main>
  );
}
