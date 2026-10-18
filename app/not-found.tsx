import { headers } from "next/headers";
import { pickLang, pickPlatform } from "@/lib/strings";
import { Notice } from "./notice";
import { stores } from "./stores";

export default async function NotFound() {
  const h = await headers();
  const lang = pickLang(h.get("accept-language"));
  return (
    <Notice
      lang={lang}
      platform={pickPlatform(h.get("user-agent"))}
      stores={await stores(process.env.APP_STORE_URL)}
      title={lang === "ar" ? "هذه الصفحة غير موجودة." : "This page doesn't exist."}
      body={lang === "ar" ? "This page doesn't exist." : "هذه الصفحة غير موجودة."}
    />
  );
}
