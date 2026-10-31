import "./globals.css";
const bp = process.env.NEXT_PUBLIC_BP || "";
export const metadata = { title: "Клиника CRM", manifest: bp + "/manifest.json" };
export const viewport = { themeColor: "#6C4AD4", width: "device-width", initialScale: 1 };
export default function L({ children }: { children: React.ReactNode }) {
  return (<html lang="ru"><head><link rel="apple-touch-icon" href={bp + "/icon-192.png"} /></head><body>{children}
    <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator)navigator.serviceWorker.register('${bp}/sw.js')` }} /></body></html>);
}
