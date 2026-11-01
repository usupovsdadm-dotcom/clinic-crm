"use client";
import { useState } from "react";
import { registerClinic, loginReal, logout } from "@/lib/api";
const inp = "w-full border border-brand-line rounded-xl px-3 py-2.5 text-sm focus:outline-brand";
export function DemoBanner() {
  return <div className="sticky top-0 z-40 bg-brand text-white text-sm flex items-center justify-center gap-3 px-3 py-1.5"><span className="hidden sm:inline">Это демо-версия с тестовыми данными</span><span className="sm:hidden">Демо-версия</span><a href="#register" className="bg-white text-brand font-semibold rounded-lg px-3 py-1 text-xs whitespace-nowrap">Зарегистрировать клинику</a><a href="#login" className="hidden md:inline text-xs underline opacity-90">Войти</a></div>;
}
function Soon() {
  const [n, setN] = useState(""); const [p, setP] = useState("");
  const body = encodeURIComponent(`Хочу подключить клинику к CRM.\nИмя: ${n}\nТелефон: ${p}`);
  return <div className="space-y-3"><div className="text-3xl">🚀</div><h2 className="text-xl font-bold">Скоро запуск</h2><p className="text-sm text-mute">Регистрация клиник откроется в ближайшее время. Оставьте контакты — мы напишем, как только подключение заработает.</p>
    <input className={inp} placeholder="Ваше имя" value={n} onChange={e => setN(e.target.value)} /><input className={inp} placeholder="Телефон или Telegram" value={p} onChange={e => setP(e.target.value)} />
    <a href={`mailto:hello@clinic-crm.ru?subject=${encodeURIComponent("Заявка на подключение CRM")}&body=${body}`} className="block text-center bg-brand text-white rounded-xl py-2.5 font-semibold">Оставить заявку</a>
    <a href="#" className="block text-center text-sm text-brand">← Вернуться в демо</a></div>;
}
export function AuthScreen({ mode, onDone }: { mode: "register" | "login"; onDone: () => void }) {
  const [f, setF] = useState({ clinicName: "", city: "", ownerName: "", phone: "", email: "", password: "", consent: false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [soon, setSoon] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const submit = async (e: any) => { e.preventDefault(); setErr("");
    if (mode === "register" && !f.consent) return setErr("Нужно согласие с офертой и политикой обработки ПДн");
    if (f.password.length < 8) return setErr("Пароль — минимум 8 символов");
    setBusy(true);
    try { mode === "register" ? await registerClinic(f) : await loginReal(f.email, f.password); onDone(); }
    catch (x: any) { if (x.message === "NO_API") setSoon(true); else setErr(x.message); } finally { setBusy(false); } };
  return <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4"><div className="bg-white rounded-card shadow-card w-full max-w-md p-6">
    <div className="font-extrabold text-xl text-brand mb-4">◆ Клиника CRM</div>
    {soon ? <Soon /> : <form onSubmit={submit} className="space-y-3">
      <h1 className="text-xl font-bold">{mode === "register" ? "Регистрация клиники" : "Вход"}</h1>
      {mode === "register" && <><input className={inp} required placeholder="Название клиники" value={f.clinicName} onChange={set("clinicName")} />
        <input className={inp} required placeholder="Город" value={f.city} onChange={set("city")} />
        <input className={inp} required placeholder="Имя владельца" value={f.ownerName} onChange={set("ownerName")} />
        <input className={inp} required type="tel" placeholder="Телефон" value={f.phone} onChange={set("phone")} /></>}
      <input className={inp} required type="email" placeholder="Email" value={f.email} onChange={set("email")} />
      <input className={inp} required type="password" placeholder="Пароль (от 8 символов)" value={f.password} onChange={set("password")} />
      {mode === "register" && <label className="flex gap-2 text-xs text-mute items-start"><input type="checkbox" checked={f.consent} onChange={set("consent")} className="mt-0.5" /><span>Принимаю <a href="#offer" className="text-brand underline">оферту</a> и <a href="#privacy" className="text-brand underline">политику обработки персональных данных</a> (152-ФЗ)</span></label>}
      {err && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{err}</div>}
      <button disabled={busy} className="w-full bg-brand text-white rounded-xl py-2.5 font-semibold shadow-btn disabled:opacity-60">{busy ? "Подождите…" : mode === "register" ? "Создать клинику" : "Войти"}</button>
      <div className="text-center text-sm">{mode === "register" ? <>Уже есть аккаунт? <a href="#login" className="text-brand font-semibold">Войти</a></> : <>Нет аккаунта? <a href="#register" className="text-brand font-semibold">Зарегистрировать клинику</a></>}</div>
      <a href="#" className="block text-center text-xs text-mute">← Вернуться в демо</a></form>}</div></div>;
}
export function RealHome({ onLogout }: { onLogout: () => void }) {
  const name = typeof window !== "undefined" ? localStorage.getItem("crm-clinic") || "Ваша клиника" : "";
  const steps = [["👩‍⚕️", "Добавьте врачей", "ФИО, специальность, кабинет"], ["📅", "Настройте расписание", "Рабочие часы и длительность приёма"], ["🔌", "Подключите каналы", "Telegram, ВКонтакте, Макс, WhatsApp"], ["📥", "Импортируйте пациентов", "Excel/CSV или вручную"]];
  return <div className="md:flex min-h-screen bg-brand-bg">
    <aside className="hidden md:flex flex-col w-56 bg-white border-r border-brand-line p-4 gap-1"><div className="font-extrabold text-xl text-brand mb-5">◆ {name}</div>
      {["📅 Расписание", "👤 Пациенты", "💬 Мультичат", "📊 Аналитика"].map(x => <div key={x} className="px-3 py-2.5 rounded-xl text-[#5C4E78]">{x}</div>)}
      <button onClick={() => { logout(); onLogout(); }} className="mt-auto text-sm text-mute underline text-left">Выйти (вернуться в демо)</button></aside>
    <main className="flex-1 p-4 md:p-8"><div className="md:hidden flex justify-between mb-4"><b className="text-brand">◆ {name}</b><button onClick={() => { logout(); onLogout(); }} className="text-sm text-mute underline">Выйти</button></div>
      <h1 className="text-2xl font-bold mb-1">Добро пожаловать! 👋</h1><p className="text-mute mb-5">CRM пока пустая. Пройдите 4 шага — и можно принимать пациентов.</p>
      <div className="bg-white rounded-card shadow-card p-5 max-w-2xl"><div className="flex justify-between mb-3"><b>Чек-лист запуска</b><span className="text-sm text-mute">0 из 4</span></div><div className="h-2 bg-brand-soft rounded-full mb-4" />
        {steps.map(([i, t, d]) => <div key={t} className="flex items-center gap-3 py-3 border-t border-brand-line"><span className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center text-lg">{i}</span><div className="flex-1"><b>{t}</b><div className="text-sm text-mute">{d}</div></div><button className="text-sm bg-brand text-white rounded-lg px-3 py-1.5">Начать</button></div>)}</div></main></div>;
}
