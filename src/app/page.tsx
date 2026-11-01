"use client";
import { useState, useEffect } from "react";
import { useDB, useLocal, Role, resetDB, workday } from "@/lib/store";
import Schedule, { Slot } from "@/components/Schedule";
import Booking from "@/components/Booking";
import { PatientList, PatientCard } from "@/components/Patients";
import Dashboard from "@/components/Dashboard";
import Multichat from "@/components/Multichat";
import { DemoBanner, AuthScreen, RealHome } from "@/components/Auth";
const bp = process.env.NEXT_PUBLIC_BP || "";
type Tab = "schedule" | "patients" | "dash" | "chat" | "chatan" | "chatstyle";
export default function Home() {
  const db = useDB(); const [role, setRole] = useLocal<Role>("crm-role", "admin");
  const [tab, setTab] = useState<Tab>("schedule"); const [auth, setAuth] = useState<"" | "register" | "login">(""); const [real, setReal] = useState(false); const [cv, setCv] = useState("inbox"); const [pid, setPid] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null); const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { setReal(!!localStorage.getItem("crm-token")); const hc = () => { const h = location.hash.slice(1); setAuth(h === "register" || h === "login" ? h : ""); if (h.startsWith("chat/")) { setTab("chat"); setCv(h.slice(5)); } else if (h === "chat") { setTab("chat"); setCv("inbox"); } else if (h === "chatan" || h === "chatstyle") setTab(h); }; window.addEventListener("hashchange", hc); const h = location.hash.slice(1); hc(); if (h === "patients" || h === "dash") setTab(h); if (h.startsWith("p/")) { setTab("patients"); setPid(h.slice(2)); } const r = new URLSearchParams(location.search).get("role"); if (r === "admin" || r === "doctor" || r === "owner") setRole(r); }, []);
  useEffect(() => { if (role === "doctor" && (tab === "dash" || tab.startsWith("chat"))) setTab("schedule"); }, [role, tab]);
  if (real) return <RealHome onLogout={() => { setReal(false); location.hash = ""; }} />;
  if (auth) return <AuthScreen mode={auth} onDone={() => { setReal(true); location.hash = ""; }} />;
  if (!db) return <div className="p-10 text-mute">Загрузка…</div>;
  const tabs: [Tab, string, string][] = [["schedule", "📅", "Расписание"], ["patients", "👤", "Пациенты"], ...(role !== "doctor" ? [["chat", "💬", "Мультичат"] as [Tab, string, string]] : []), ...(role !== "doctor" ? [["dash", "📊", "Аналитика"] as [Tab, string, string]] : [])];
  const go = (t: Tab) => { setTab(t); if (t === "chat") setCv("inbox"); setPid(null); location.hash = t; };
  const open = (id: string) => { setTab("patients"); setPid(id); location.hash = "p/" + id; };
  const RoleSw = <div className="flex bg-brand-soft rounded-2xl p-1 text-xs">{([["admin", "Админ"], ["doctor", "Врач"], ["owner", "Владелец"]] as [Role, string][]).map(([r, t]) => <button key={r} onClick={() => setRole(r)} className={`flex-1 px-2 py-1 rounded-xl font-semibold ${role === r ? "bg-white text-brand shadow" : "text-brand/70"}`}>{t}</button>)}</div>;
  return <><DemoBanner /><div className="md:flex min-h-screen">
    <aside className="hidden md:flex flex-col w-56 bg-white border-r border-brand-line p-4 gap-1 sticky top-8 h-[calc(100vh-32px)]">
      <div className="font-extrabold text-xl text-brand mb-5">◆ Клиника</div>
      {[...tabs, ...(role !== "doctor" ? [["chatan", "✦", "Аналитика переписок"], ["chatstyle", "✦", "Стиль общения"]] as [Tab, string, string][] : [])].map(([t, i, n]) => <button key={t} onClick={() => go(t)} className={`text-left px-3 py-2.5 rounded-xl ${tab === t ? "bg-brand-soft text-brand font-semibold" : "text-[#5C4E78] hover:bg-brand-bg"}`}>{i} {n}</button>)}
      <a href={bp + "/widget/"} target="_blank" className="px-3 py-2.5 rounded-xl text-[#5C4E78] hover:bg-brand-bg">🌐 Онлайн-запись ↗</a>
      <div className="mt-auto"><a href="#register" className="block text-center bg-brand text-white rounded-xl py-2 text-sm font-semibold shadow-btn mb-3">Зарегистрировать клинику</a><div className="text-xs text-mute mb-1">Роль (демо)</div>{RoleSw}
        <div className="text-xs text-mute mt-2">{role === "doctor" ? "Вы: Иванова П.С. · контакты скрыты" : role === "owner" ? "Только просмотр расписания" : "Полный доступ к записи"}</div>
        <button className="text-xs text-mute underline mt-3" onClick={() => confirm("Сбросить демо-данные?") && resetDB()}>Сбросить демо-данные</button></div></aside>
    <header className="md:hidden sticky top-8 z-30 bg-white/90 backdrop-blur border-b border-brand-line px-4 py-2 flex items-center gap-3"><span className="font-extrabold text-brand">◆ Клиника</span><div className="flex-1">{RoleSw}</div></header>
    <main className="flex-1 p-3 md:p-6 pb-24 md:pb-6 min-w-0">
      {tab === "schedule" && <Schedule db={db} role={role} myDoc="d1" onBook={setSlot} onOpen={open} />}
      {tab === "patients" && (pid ? <PatientCard db={db} role={role} pid={pid} onBack={() => go("patients")} onBook={() => setSlot({ did: "d1", date: workday(), start: -1 })} /> : <PatientList db={db} role={role} onOpen={open} />)}
      {tab === "dash" && <Dashboard db={db} />}
      {tab === "chat" && <Multichat view={cv} />}
      {tab === "chatan" && <Multichat view="analytics" />}
      {tab === "chatstyle" && <Multichat view="style" />}
    </main>
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-brand-line flex z-30">{tabs.map(([t, i, n]) => <button key={t} onClick={() => go(t)} className={`flex-1 py-2 text-xs ${tab === t ? "text-brand font-semibold" : "text-mute"}`}><div className="text-lg">{i}</div>{n}</button>)}
      <a href={bp + "/widget/"} className="flex-1 py-2 text-xs text-mute text-center"><div className="text-lg">🌐</div>Онлайн</a></nav>
    {slot && <Booking db={db} role={role} slot={slot} onClose={m => { setSlot(null); if (m) { setToast(m); setTimeout(() => setToast(null), 3500); } }} />}
    {toast && <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white rounded-2xl px-4 py-3 shadow-card z-50">{toast}</div>}
  </div></>;
}
