const PLAY = "https://play.google.com/store/apps/details?id=ae.appzone.sukun";

/** The store buttons; the App Store one shows once its link is known. */
export function Stores({ appStore, googlePlay = PLAY }: { appStore?: string | null; googlePlay?: string }) {
  return (
    <div className="stores">
      {appStore ? (
        <a className="store" href={appStore}>
          App Store
        </a>
      ) : null}
      <a className="store" href={googlePlay}>
        Google Play
      </a>
    </div>
  );
}
