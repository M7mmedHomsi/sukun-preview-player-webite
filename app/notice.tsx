import { DEFAULT_LOOK } from "@/lib/share";
import type { Lang, Platform } from "@/lib/strings";
import { Backdrop } from "./backdrop";
import { GetSukun, type Stores } from "./get-sukun";

/**
 * A page with no session to play (the bare address, a used-up link, a
 * wrong address): Sukun's silk, the app icon, a few words, and where to get
 * the app on the app's sheet card.
 */
export function Notice({
  lang,
  platform,
  stores,
  title,
  body,
}: {
  lang: Lang;
  platform: Platform;
  stores: Stores;
  title: string;
  body: string;
}) {
  return (
    <div className="screen">
      <Backdrop look={DEFAULT_LOOK} />
      <main className="column notice">
        <div className="grow" />
        <img className="notice-icon" src="/icon.png" alt="" width={96} height={96} />
        <h1 className="notice-title">{title}</h1>
        <p className="notice-body">{body}</p>
        <div className="grow" />
        <div className="card">
          <GetSukun lang={lang} platform={platform} stores={stores} />
        </div>
      </main>
    </div>
  );
}
