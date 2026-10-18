import { Stores } from "./stores";

export default function NotFound() {
  return (
    <main className="card">
      <img className="logo" src="/icon.png" alt="" />
      <h1 style={{ marginTop: 16 }}>Sukun · سُكون</h1>
      <p className="about">This page doesn't exist. · هذه الصفحة غير موجودة.</p>
      <Stores appStore={process.env.APP_STORE_URL} />
    </main>
  );
}
