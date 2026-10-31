"use client";
import { useState } from "react";
import { DB, Role, save, fioFull, short, hm, uid, maskPhone, ymd } from "@/lib/store";
const kindC: Record<string, string> = { protocol: "border-brand", lab: "border-okc", note: "border-[#8B6BE0]", file: "border-amber-500" };
const kindT: Record<string, string> = { protocol: "протокол", lab: "анализы", note: "заметка", file: "файл" };
const author = (r: Role) => r === "doctor" ? "Иванова П.С." : r === "owner" ? "Владелец" : "Админ";
export function PatientList({ db, role, onOpen }: { db: DB; role: Role; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const list = db.patients.filter(p => (fioFull(p) + p.phone).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.last.localeCompare(b.last, "ru"));
  return <div><div className="flex justify-between items-center mb-4 gap-3"><h1 className="text-2xl font-bold">Пациенты <span className="text-mute text-base">{db.patients.length}</span></h1><input className="inp max-w-sm" placeholder="🔍 Фамилия или телефон" value={q} onChange={e => setQ(e.target.value)} /></div>
    <div className="card !p-2">{list.map(p => { const last = db.appts.filter(a => a.pid === p.id).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))[0];
      return <button key={p.id} onClick={() => onOpen(p.id)} className="w-full text-left flex gap-3 items-center p-3 rounded-2xl hover:bg-brand-bg">
        <span className="w-9 h-9 rounded-full bg-brand-soft text-brand grid place-items-center font-bold text-xs shrink-0">{p.last[0]}{p.first[0]}</span>
        <span className="flex-1 min-w-0"><b>{fioFull(p)}</b><span className="block text-mute text-xs">{role === "doctor" ? maskPhone(p.phone) : p.phone} · {p.source}</span></span>
        <span className="hidden sm:block text-mute text-xs">{last ? `визит ${last.date.split("-").reverse().join(".")}` : "нет визитов"}</span>{p.tags.map(t => <span key={t} className="chip hidden sm:inline">{t}</span>)}</button>; })}</div></div>;
}
export function PatientCard({ db, role, pid, onBack, onBook }: { db: DB; role: Role; pid: string; onBack: () => void; onBook: () => void }) {
  const p = db.patients.find(x => x.id === pid)!; const [text, setText] = useState(""); const [kind, setKind] = useState<"note" | "protocol">("note");
  const [task, setTask] = useState(""); const [due, setDue] = useState(ymd(new Date()));
  const now = () => { const d = new Date(); return `${ymd(d)} ${hm(d.getHours() * 60 + d.getMinutes())}`; };
  const feed = db.feed.filter(f => f.pid === pid).sort((a, b) => b.at.localeCompare(a.at));
  const tasks = db.tasks.filter(t => t.pid === pid).sort((a, b) => +a.done - +b.done || a.due.localeCompare(b.due));
  const appts = db.appts.filter(a => a.pid === pid).sort((a, b) => (b.date + hm(b.start)).localeCompare(a.date + hm(a.start)));
  const paid = appts.filter(a => a.status === "paid").reduce((s, a) => s + a.price, 0);
  const files = feed.filter(f => f.file);
  const upload = (fl: FileList | null) => { if (!fl) return; Array.from(fl).forEach(f => { if (f.size > 1.5e6) return alert(`${f.name}: в прототипе файлы до 1,5 МБ (хранятся в браузере)`); const r = new FileReader(); r.onload = () => save(x => { x.feed.push({ id: uid(), pid, at: now(), author: author(role), kind: "file", text: f.name, file: { name: f.name, data: r.result as string, size: f.size } }); }); r.readAsDataURL(f); }); };
  return <div>
    <button onClick={onBack} className="text-brand mb-3">‹ Назад</button>
    <div className="card flex flex-wrap gap-4 items-center mb-4"><span className="w-16 h-16 rounded-full bg-brand-soft text-brand grid place-items-center font-bold text-xl">{p.last[0]}{p.first[0]}</span>
      <div className="flex-1 min-w-[220px]"><h1 className="text-xl md:text-2xl font-bold">{fioFull(p)}</h1>
        <span className="text-mute">{p.birth && p.birth.split("-").reverse().join(".") + " · "}{role === "doctor" ? <span title="Контакты скрыты для роли «врач»">{maskPhone(p.phone)} 🔒</span> : p.phone} · источник: {p.source}</span>
        <div className="mt-1 flex gap-1 flex-wrap"><span className="chip !bg-okbg !text-okc">Согласие 152-ФЗ ✓</span>{p.tags.map(t => <span key={t} className="chip">{t}</span>)}</div></div>
      {role !== "doctor" && <a className="btn-g" href={`tel:${p.phone.replace(/\D/g, "")}`}>📞 Позвонить</a>}
      {role !== "owner" && <button className="btn" onClick={onBook}>+ Запись</button>}</div>
    <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
      <div className="card"><h2 className="font-bold mb-3">Ведение пациента <span className="text-mute font-normal text-xs">без лимита символов</span></h2>
        <div className="border border-brand-line rounded-2xl p-2 mb-4" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); upload(e.dataTransfer.files); }}>
          <textarea className="w-full outline-none resize-y min-h-[80px] p-1" placeholder="Заметка или протокол… можно перетащить файл сюда" value={text} onChange={e => setText(e.target.value)} />
          <div className="flex flex-wrap gap-2 items-center justify-between"><div className="flex gap-1">{(["note", "protocol"] as const).map(k => <button key={k} onClick={() => setKind(k)} className={`chip ${kind === k ? "!bg-brand !text-white" : ""}`}>{kindT[k]}</button>)}
            <label className="chip cursor-pointer">📎 файл<input type="file" multiple hidden onChange={e => upload(e.target.files)} /></label></div>
            <span className="text-mute text-xs">{text.length} симв.</span>
            <button className="btn !py-1.5" disabled={!text.trim()} onClick={() => { save(x => { x.feed.push({ id: uid(), pid, at: now(), author: author(role), kind, text }); }); setText(""); }}>Добавить</button></div></div>
        {feed.map(f => <div key={f.id} className={`border-l-[3px] pl-3 mb-4 ${kindC[f.kind]}`}><b>{f.at.slice(8, 10)}.{f.at.slice(5, 7)} {f.at.slice(11)} · {f.author}</b> <span className="chip">{kindT[f.kind]}</span>
          {f.file ? <a download={f.file.name} href={f.file.data} className="block text-brand mt-1">📄 {f.file.name} <span className="text-mute">({Math.round(f.file.size / 1024)} КБ)</span></a> : <p className="text-[#5C4E78] whitespace-pre-wrap mt-1">{f.text}</p>}</div>)}
        {!feed.length && <p className="text-mute">Записей пока нет</p>}</div>
      <div className="flex flex-col gap-4">
        <div className="card"><h2 className="font-bold mb-2">Задачи по пациенту</h2>
          {tasks.map(t => <label key={t.id} className={`flex gap-2 items-start py-1 ${t.done ? "text-mute line-through" : ""}`}><input type="checkbox" checked={t.done} onChange={() => save(x => { const y = x.tasks.find(z => z.id === t.id)!; y.done = !y.done; })} className="mt-1 accent-brand" />
            <span className="flex-1">{t.text}<span className={`block text-xs ${!t.done && t.due < ymd(new Date()) ? "text-red-500" : "text-mute"}`}>до {t.due.split("-").reverse().join(".")}</span></span></label>)}
          <div className="flex gap-1 mt-2"><input className="inp !py-1.5" placeholder="Новая задача" value={task} onChange={e => setTask(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && task.trim()) { save(x => { x.tasks.push({ id: uid(), pid, text: task, due, done: false }); }); setTask(""); } }} />
            <input type="date" className="inp !py-1.5 !w-36" value={due} onChange={e => setDue(e.target.value)} /></div></div>
        <div className="card"><h2 className="font-bold mb-2">Файлы</h2>{files.length ? files.map(f => <a key={f.id} download={f.file!.name} href={f.file!.data} className="block text-brand truncate">📄 {f.file!.name}</a>) : <p className="text-mute">Нет файлов</p>}</div>
        <div className="card"><h2 className="font-bold mb-2">Визиты</h2>{appts.slice(0, 6).map(a => <p key={a.id} className="text-xs py-0.5">{a.date.split("-").reverse().join(".")} {hm(a.start)} · {short(db.doctors.find(d => d.id === a.did)!)} · {a.service}</p>)}
          {role !== "doctor" && <p className="mt-2 font-semibold">Оплачено: {paid.toLocaleString("ru")} ₽</p>}</div>
      </div></div></div>;
}
