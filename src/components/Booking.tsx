"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { DB, Role, save, conflict, fioFull, short, hm, uid, maskPhone, DAY_START, DAY_END, STEP } from "@/lib/store";
import type { Slot } from "./Schedule";
export function parseNew(s: string) {
  const ph = s.match(/(\+?[78])?[\s(-]*(\d{3})[\s)-]*(\d{3})[\s-]*(\d{2})[\s-]*(\d{2})/);
  const words = s.replace(ph?.[0] ?? "", "").trim().split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase());
  if (words.length < 2 || !ph) return null;
  return { last: words[0], first: words[1], mid: words.slice(2).join(" "), phone: `+7 ${ph[2]} ${ph[3]}-${ph[4]}-${ph[5]}` };
}
export function freeSlots(db: DB, did: string, date: string, dur = 30) {
  const doc = db.doctors.find(x => x.id === did)!; const out: number[] = [];
  for (let t = DAY_START; t + dur <= DAY_END; t += STEP) if (!conflict(db, { did, cab: doc.cab, date, start: t, dur })) out.push(t);
  return out;
}
export default function Booking({ db, role, slot, onClose }: { db: DB; role: Role; slot: Slot; onClose: (msg?: string) => void }) {
  const [q, setQ] = useState(""); const [pid, setPid] = useState<string | null>(null);
  const [did, setDid] = useState(slot.did); const [date, setDate] = useState(slot.date);
  const [start, setStart] = useState(slot.start); const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const found = useMemo(() => { const s = q.trim().toLowerCase(); if (!s) return db.patients.slice(0, 4); const dg = s.replace(/\D/g, "");
    return db.patients.filter(p => (p.last + " " + p.first + " " + p.mid).toLowerCase().includes(s) || (dg.length >= 3 && p.phone.replace(/\D/g, "").includes(dg))).slice(0, 6); }, [q, db.patients]);
  const np = parseNew(q); const slots = freeSlots(db, did, date);
  const doc = db.doctors.find(x => x.id === did)!;
  const step = !pid ? 1 : start < 0 || !slots.includes(start) ? 2 : 3;
  const book = () => {
    if (!pid || step !== 3) return;
    save(x => { x.appts.push({ id: uid(), pid, did, cab: doc.cab, date, start, dur: 30, service: "Первичный приём", status: "new", price: doc.price }); });
    const p = db.patients.find(x => x.id === pid)!;
    onClose(`✓ ${p.last} ${p.first} записан(а) к ${short(doc)} на ${hm(start)}`);
  };
  const addNew = () => { if (!np) return; const id = "p" + uid(); save(x => { x.patients.push({ id, ...np, birth: "", tags: [], source: "Звонок" }); }); setPid(id); };
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "Enter") { if (step === 3) book(); else if (!pid && found.length === 1) setPid(found[0].id); else if (!pid && np && !found.length) addNew(); } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); });
  const p = pid ? db.patients.find(x => x.id === pid) : null;
  return (<div className="fixed inset-0 bg-ink/35 z-40 flex items-end md:items-center justify-center" onClick={() => onClose()}>
    <div className="card w-full md:w-[580px] max-h-[92vh] overflow-y-auto !rounded-b-none md:!rounded-card !p-5" onClick={e => e.stopPropagation()}>
      <div className="flex gap-2 mb-4">{[1, 2, 3].map(i => <span key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-brand" : "bg-brand-line"}`} />)}</div>
      <h2 className="font-bold text-base mb-3">Новая запись · шаг {step} из 3</h2>
      {!p ? <>
        <input ref={ref} className="inp mb-2" placeholder="🔍 Фамилия, телефон — или новый: «Иванов Иван Иванович +7 999 123-45-67»" value={q} onChange={e => setQ(e.target.value)} />
        {found.map(x => <button key={x.id} onClick={() => setPid(x.id)} className="w-full text-left flex gap-3 items-center p-2.5 rounded-2xl hover:bg-brand-soft">
          <span className="w-9 h-9 rounded-full bg-brand-soft text-brand grid place-items-center font-bold text-xs">{x.last[0]}{x.first[0]}</span>
          <span className="flex-1"><b>{fioFull(x)}</b><span className="block text-mute text-xs">{x.birth && x.birth.split("-").reverse().join(".") + " · "}{role === "doctor" ? maskPhone(x.phone) : x.phone}</span></span></button>)}
        {q && !found.length && <button disabled={!np} onClick={addNew} className="w-full text-left p-2.5 rounded-2xl text-brand hover:bg-brand-soft disabled:text-mute">
          {np ? <>+ Новый пациент: <b>{np.last} {np.first} {np.mid}</b>, {np.phone} <span className="text-mute">(Enter)</span></> : "Для нового пациента введите ФИО и телефон одной строкой"}</button>}
      </> : <div className="flex gap-3 items-center p-2.5 rounded-2xl bg-brand-soft mb-2"><span className="flex-1"><b>{fioFull(p)}</b><span className="block text-mute text-xs">{role === "doctor" ? maskPhone(p.phone) : p.phone}</span></span><button className="text-brand text-xs" onClick={() => setPid(null)}>изменить</button></div>}
      <div className="flex gap-2 mt-4 mb-2"><select className="inp" value={did} onChange={e => setDid(e.target.value)}>{db.doctors.map(x => <option key={x.id} value={x.id}>{short(x)} · {x.spec} · {x.price} ₽</option>)}</select>
        <input type="date" className="inp !w-44" value={date} onChange={e => setDate(e.target.value)} /></div>
      <div className="flex flex-wrap gap-1.5">{slots.length ? slots.map(t => <button key={t} onClick={() => setStart(t)} className={`px-3 py-1.5 rounded-xl border font-semibold ${t === start ? "bg-brand text-white border-brand" : "border-brand-line text-ink hover:border-brand"}`}>{hm(t)}</button>) : <span className="text-mute">Свободных слотов нет — выберите другой день</span>}</div>
      <div className="flex justify-between items-center mt-5 gap-3"><label className="text-mute text-xs"><input type="checkbox" defaultChecked /> Подтверждение в Telegram/SMS (демо)</label>
        <button className="btn" disabled={step !== 3} onClick={book}>Записать (Enter)</button></div>
    </div></div>);
}
