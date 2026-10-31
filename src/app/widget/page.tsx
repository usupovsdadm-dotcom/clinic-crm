"use client";
import { useState } from "react";
import { useDB, save, fioFull, hm, ymd, addDays, uid } from "@/lib/store";
import { freeSlots } from "@/components/Booking";
const WD = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
export default function Widget() {
  const db = useDB(); const [did, setDid] = useState<string | null>(null); const [date, setDate] = useState(ymd(new Date()));
  const [t, setT] = useState<number | null>(null); const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [code, setCode] = useState(""); const [sent, setSent] = useState(false); const [done, setDone] = useState("");
  if (!db) return null;
  const days = Array.from({ length: 10 }, (_, i) => addDays(ymd(new Date()), i)).filter(d => new Date(d + "T12:00").getDay() !== 0);
  const doc = did ? db.doctors.find(d => d.id === did)! : null;
  const slots = doc ? freeSlots(db, doc.id, date).filter(x => date !== ymd(new Date()) || x > new Date().getHours() * 60 + new Date().getMinutes()) : [];
  const confirm = () => { const w = name.trim().split(/\s+/); const pid = "p" + uid(); const dg = phone.replace(/\D/g, "").slice(-10);
    save(x => { x.patients.push({ id: pid, last: w[0] || "Пациент", first: w[1] || "", mid: w.slice(2).join(" "), phone: `+7 ${dg.slice(0, 3)} ${dg.slice(3, 6)}-${dg.slice(6, 8)}-${dg.slice(8)}`, birth: "", tags: [], source: "Сайт" }); x.appts.push({ id: uid(), pid, did: doc!.id, cab: doc!.cab, date, start: t!, dur: 30, service: "Первичный приём", status: "new", price: doc!.price, online: true }); });
    setDone(`${fioFull(doc!)}, ${date.split("-").reverse().join(".")} в ${hm(t!)}`); };
  return <div className="min-h-screen bg-[#efeaf9] flex justify-center p-3 sm:p-8"><div className="w-full max-w-md bg-white rounded-[32px] shadow-[0_20px_50px_rgba(60,30,120,.15)] p-5 h-fit">
    <div className="font-extrabold text-xl text-brand mb-1">◆ Клиника «Здоровье»</div><p className="text-mute mb-4">Онлайн-запись к врачу · демо</p>
    {done ? <div className="text-center py-8"><div className="text-5xl mb-3">✅</div><h2 className="font-bold text-lg mb-1">Вы записаны!</h2><p className="text-[#5C4E78]">{done}</p><p className="text-mute text-xs mt-3">Напомним за день и за 2 часа. Запись уже видна в расписании клиники.</p><button className="btn-g mt-5" onClick={() => { setDone(""); setT(null); setDid(null); setSent(false); setCode(""); }}>Записаться ещё</button></div> : <>
    {db.doctors.map(d => <button key={d.id} onClick={() => { setDid(d.id); setT(null); }} className={`w-full text-left flex gap-3 items-center p-3 rounded-2xl border mb-2 ${did === d.id ? "border-brand bg-brand-bg" : "border-brand-line"}`}>
      <span className="w-10 h-10 rounded-full bg-brand-soft text-brand grid place-items-center font-bold text-sm">{d.last[0]}{d.first[0]}</span><span className="flex-1"><b>{fioFull(d)}</b><span className="block text-mute text-xs">{d.spec} · ★ 4,{9 - +d.id.slice(1) % 3}</span></span><b>{d.price.toLocaleString("ru")} ₽</b></button>)}
    {doc && <><div className="flex gap-1.5 overflow-x-auto my-3 pb-1">{days.map(d => { const x = new Date(d + "T12:00"); return <button key={d} onClick={() => { setDate(d); setT(null); }} className={`shrink-0 w-12 py-2 rounded-xl text-center ${date === d ? "bg-brand text-white" : "bg-brand-bg"}`}>{WD[x.getDay()]}<br /><b>{x.getDate()}</b></button>; })}</div>
      <div className="flex flex-wrap gap-1.5">{slots.length ? slots.map(s => <button key={s} onClick={() => setT(s)} className={`px-3 py-1.5 rounded-xl font-semibold ${t === s ? "bg-brand text-white" : "bg-brand-soft text-brand"}`}>{hm(s)}</button>) : <span className="text-mute">Нет свободного времени</span>}</div></>}
    {t !== null && <div className="mt-4 flex flex-col gap-2"><input className="inp" placeholder="Фамилия Имя Отчество" value={name} onChange={e => setName(e.target.value)} /><input className="inp" inputMode="tel" placeholder="+7 (___) ___-__-__" value={phone} onChange={e => setPhone(e.target.value)} />
      {sent && <input className="inp" inputMode="numeric" placeholder="Код из SMS (демо: любые 4 цифры)" value={code} onChange={e => setCode(e.target.value)} />}
      {!sent ? <button className="btn" disabled={name.trim().split(/\s+/).length < 2 || phone.replace(/\D/g, "").length < 10} onClick={() => setSent(true)}>Получить код</button>
        : <button className="btn" disabled={code.length < 4} onClick={confirm}>Записаться на {hm(t)}</button>}</div>}
    <p className="text-mute text-xs mt-4 text-center">Нажимая «Записаться», вы соглашаетесь на обработку персональных данных (152-ФЗ)</p></>}
  </div></div>;
}
