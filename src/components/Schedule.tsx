"use client";
import { useState } from "react";
import { DB, Role, Appt, save, conflict, fio, short, hm, addDays, ymd, DAY_START, DAY_END, STEP, workday } from "@/lib/store";
const ROW = 44; const WD = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
const M = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const stCls: Record<string, string> = { paid: "border-okc bg-okbg", confirmed: "border-brand bg-brand-soft", new: "border-amber-500 bg-amber-50", noshow: "border-gray-400 bg-gray-100 opacity-60" };
const stTxt: Record<string, string> = { paid: "оплачено", confirmed: "подтвердил ✓", new: "ждём подтверждения", noshow: "неявка" };
export type Slot = { did: string; date: string; start: number };
export default function Schedule({ db, role, onBook, onOpen, myDoc }: { db: DB; role: Role; onBook: (s: Slot) => void; onOpen: (pid: string) => void; myDoc: string }) {
  const [date, setDate] = useState(workday());
  const [view, setView] = useState<"day" | "week">("day");
  const [group, setGroup] = useState<"doc" | "cab">("doc");
  const [wdoc, setWdoc] = useState(role === "doctor" ? myDoc : "d1");
  const [drag, setDrag] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(null), 3000); };
  const d = new Date(date + "T12:00");
  const weekStart = addDays(date, -((d.getDay() + 6) % 7));
  type Col = { key: string; title: React.ReactNode; date: string; did?: string; cab?: string };
  const cols: Col[] = view === "week"
    ? Array.from({ length: 6 }, (_, i) => { const x = addDays(weekStart, i); const dt = new Date(x + "T12:00"); return { key: x, date: x, did: wdoc, title: <span className={x === ymd(new Date()) ? "text-brand" : ""}>{WD[dt.getDay()]}, {dt.getDate()}</span> }; })
    : group === "doc"
      ? db.doctors.map(doc => ({ key: doc.id, date, did: doc.id, title: <><span className="w-8 h-8 rounded-full bg-brand-soft text-brand grid place-items-center font-bold text-xs shrink-0">{doc.last[0]}{doc.first[0]}</span><span className="truncate">{short(doc)}</span><span className="chip hidden lg:inline">{doc.spec}</span></> }))
      : db.cabinets.map(c => ({ key: c.id, date, cab: c.id, title: <><span className="chip">🚪</span>{c.name}</> }));
  const rows = (DAY_END - DAY_START) / STEP;
  const inCol = (a: Appt, c: Col) => a.date === c.date && (c.did ? a.did === c.did : a.cab === c.cab);
  const dropTo = (c: Col, start: number) => {
    if (!drag) return; const a = db.appts.find(x => x.id === drag)!; setDrag(null);
    const did = c.did ?? a.did; const doc = db.doctors.find(x => x.id === did)!;
    const cab = c.cab ?? (c.did && c.did !== a.did ? doc.cab : a.cab);
    const moved = { ...a, did, cab, date: c.date, start };
    const why = conflict(db, moved);
    if (why) return flash("⛔ Нельзя перенести: " + why);
    save(x => { const i = x.appts.findIndex(y => y.id === a.id); x.appts[i] = moved; });
    flash(`✓ Перенесено на ${hm(start)}`);
  };
  const clickSlot = (c: Col, start: number) => {
    if (role === "owner") return;
    const did = c.did ?? db.doctors.find(x => x.cab === c.cab)?.id; if (!did) return;
    const why = conflict(db, { did, cab: c.cab ?? db.doctors.find(x => x.id === did)!.cab, date: c.date, start, dur: 30 });
    if (why) return flash("⛔ " + why);
    onBook({ did, date: c.date, start });
  };
  const dayAppts = db.appts.filter(a => a.date === date && a.status !== "noshow");
  const free = db.doctors.reduce((s, doc) => s + Array.from({ length: rows }, (_, i) => DAY_START + i * STEP).filter(t => !conflict(db, { did: doc.id, cab: doc.cab, date, start: t, dur: 30 })).length, 0);
  return (<div>
    <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
      <div><h1 className="text-xl md:text-2xl font-bold">{WD[d.getDay()]}, {d.getDate()} {M[d.getMonth()]}</h1>
        <span className="text-mute">{db.doctors.length} врача · {dayAppts.length} записей · {free} свободных слотов</span></div>
      <div className="flex flex-wrap gap-2 items-center">
        <button className="btn-g" onClick={() => setDate(addDays(date, view === "week" ? -7 : -1))}>‹</button>
        <button className="btn-g" onClick={() => setDate(workday())}>Сегодня</button>
        <button className="btn-g" onClick={() => setDate(addDays(date, view === "week" ? 7 : 1))}>›</button>
        <div className="flex bg-brand-soft rounded-2xl p-1">{(["day", "week"] as const).map(v => <button key={v} onClick={() => setView(v)} className={`px-3 py-1 rounded-xl font-semibold ${view === v ? "bg-white text-brand shadow" : "text-brand/70"}`}>{v === "day" ? "День" : "Неделя"}</button>)}</div>
        {view === "day" ? <div className="flex bg-brand-soft rounded-2xl p-1">{(["doc", "cab"] as const).map(v => <button key={v} onClick={() => setGroup(v)} className={`px-3 py-1 rounded-xl font-semibold ${group === v ? "bg-white text-brand shadow" : "text-brand/70"}`}>{v === "doc" ? "Врачи" : "Кабинеты"}</button>)}</div>
          : <select className="inp !w-auto" value={wdoc} onChange={e => setWdoc(e.target.value)}>{db.doctors.map(x => <option key={x.id} value={x.id}>{short(x)}</option>)}</select>}
        {role !== "owner" && <button className="btn" onClick={() => onBook({ did: view === "week" ? wdoc : (role === "doctor" ? myDoc : "d1"), date, start: -1 })}>+ Запись</button>}
      </div></div>
    <div className="card !p-0 overflow-x-auto">
      <div className="grid min-w-[760px]" style={{ gridTemplateColumns: `56px repeat(${cols.length}, minmax(170px,1fr))` }}>
        <div className="border-b border-brand-line" />
        {cols.map(c => <div key={c.key} className="flex gap-2 items-center p-3 border-b border-brand-line font-semibold border-l border-l-[#f3f0f9] min-w-0">{c.title}</div>)}
        <div>{Array.from({ length: rows }, (_, i) => <div key={i} style={{ height: ROW }} className="text-xs text-mute px-2 pt-1 border-t border-[#f3f0f9]">{i % 2 ? "" : hm(DAY_START + i * STEP)}</div>)}</div>
        {cols.map(c => <div key={c.key} className="relative border-l border-[#f3f0f9]">
          {Array.from({ length: rows }, (_, i) => { const t = DAY_START + i * STEP; return <div key={i} style={{ height: ROW }} onClick={() => clickSlot(c, t)} onDragOver={e => e.preventDefault()} onDrop={() => dropTo(c, t)} className={`border-t border-[#f3f0f9] ${role !== "owner" ? "hover:bg-brand-bg cursor-pointer" : ""} group`}><span className="hidden group-hover:block text-xs text-brand/60 p-1">{role !== "owner" && "+ " + hm(t)}</span></div>; })}
          {db.appts.filter(a => inCol(a, c)).map(a => { const p = db.patients.find(x => x.id === a.pid)!; const doc = db.doctors.find(x => x.id === a.did)!; const cab = db.cabinets.find(x => x.id === a.cab)!;
            return <div key={a.id} draggable={role !== "owner"} onDragStart={() => setDrag(a.id)} onDragEnd={() => setDrag(null)} onClick={() => onOpen(a.pid)} title={`${fio(p)} · ${a.service}`}
              className={`absolute left-1 right-1 rounded-xl border-l-4 px-2 py-1 text-xs cursor-pointer overflow-hidden hover:shadow-card ${stCls[a.status]} ${drag === a.id ? "opacity-40" : ""}`}
              style={{ top: (a.start - DAY_START) / STEP * ROW + 2, height: a.dur / STEP * ROW - 4 }}>
              <b className="block text-[13px] leading-tight break-words">{fio(p)}</b>
              <span className="text-[#5C4E78]">{hm(a.start)} · {a.service}{a.dur >= 60 ? <><br />{group === "cab" ? short(doc) : cab.name} · {stTxt[a.status]}</> : ` · ${stTxt[a.status]}`}</span>
            </div>; })}
        </div>)}
      </div></div>
    <p className="text-mute mt-2 text-xs">Перетащите запись, чтобы перенести. Занятый кабинет или врач блокирует запись. Фамилия всегда первой.</p>
    {toast && <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white rounded-2xl px-4 py-3 shadow-card z-50">{toast}</div>}
  </div>);
}
