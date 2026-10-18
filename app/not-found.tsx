import { STRINGS } from "@/lib/strings";
import { Brand, GetSukun } from "./stores";

export default function NotFound() {
  return (
    <div className="stage">
      <Brand />
      <main className="gone">
        <h1>This page doesn&apos;t exist.</h1>
        <p className="about">هذه الصفحة غير موجودة.</p>
      </main>
      <GetSukun t={STRINGS.en} appStore={process.env.APP_STORE_URL} />
    </div>
  );
}
