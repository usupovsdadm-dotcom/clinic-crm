"use client";
import { useCallback, useEffect, useState } from "react";
import { api, logout } from "@/lib/api";

const inp = "w-full border border-brand-line rounded-xl px-3 py-2.5 text-base md:text-sm bg-white focus:outline-brand";
const btn = "bg-brand text-white rounded-xl px-4 py-2.5 font-semibold shadow-btn disabled:opacity-50 active:scale-[.98]";
const btn2 = "border border-brand-line bg-white rounded-xl px-4 py-2.5 font-semibold text-brand active:scale-[.98]";
type Sec = "home" | "schedule" | "patients" | "chat" | "doctors" | "settings";
type Modal = null | "doctor" | "schedule" | "channels" | "import" | "patient" | "appt";
type Onb = { doctors: boolean; schedule: boolean; channels: boolean; patients: boolean; counts?: any };
const DAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const STEPS: [keyof Onb, string, string, string, Sec, Modal][] = [
  ["doctors", "👩‍⚕️", "Добавьте врачей", "ФИО, специальность, кабинет", "doctors", "doctor"],
  ["schedule", "📅", "Настройте расписание", "Рабочие часы и длительность приёма", "settings", "schedule"],
  ["channels", "🔌", "Подключите каналы", "Telegram-бот, ВКонтакте", "settings", "channels"],
  ["patients", "👥", "Импортируйте пациентов", "Из CSV/Excel или вручную", "patients", "import"],
];
const errMsg = (e: any) => e?.message || "Ошибка";

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { const o = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = o; }; }, []);
  return <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center" onClick={onClose}>
    <div className="bg-white w-full md:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4"><b className="text-lg">{title}</b><button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-brand-soft text-brand text-lg" aria-label="Закрыть">✕</button></div>
      {children}</div></div>;
}
function Err({ e }: { e: string }) { return e ? <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2 my-2">{e}</div> : null; }

function DoctorForm({ doc, onDone }: { doc?: any; onDone: () => void }) {
  const [f, setF] = useState({ name: doc?.name || "", specialty: doc?.specialty || "", room: doc?.room || "" }); const [e, setE] = useState(""); const [b, setB] = useState(false); const [n, setN] = useState(0);
  const save = async (more: boolean) => { setB(true); setE(""); try { await api(doc ? `/doctors/${doc.id}` : "/doctors", { method: doc ? "PATCH" : "POST", body: JSON.stringify(f) }); if (more) { setF({ name: "", specialty: "", room: "" }); setN(n + 1); } else onDone(); } catch (x) { setE(errMsg(x)); } setB(false); };
  return <form onSubmit={ev => { ev.preventDefault(); save(false); }} className="space-y-3">
    <input className={inp} required minLength={2} placeholder="ФИО врача" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
    <input className={inp} required minLength={2} placeholder="Специальность (например, терапевт)" value={f.specialty} onChange={e => setF({ ...f, specialty: e.target.value })} />
    <input className={inp} placeholder="Кабинет (необязательно)" value={f.room} onChange={e => setF({ ...f, room: e.target.value })} />
    {n > 0 && <div className="text-sm text-okc">Добавлено врачей: {n}</div>}<Err e={e} />
    <div className="flex gap-2 flex-wrap"><button disabled={b} className={btn}>Сохранить</button>{!doc && <button type="button" disabled={b || f.name.length < 2 || f.specialty.length < 2} onClick={() => save(true)} className={btn2}>Сохранить и добавить ещё</button>}</div>
  </form>;
}

function ScheduleForm({ cur, onDone }: { cur?: any; onDone: () => void }) {
  const init = cur?.days?.length ? cur.days : [1, 2, 3, 4, 5].map(day => ({ day, from: "09:00", to: "20:00" }));
  const [days, setDays] = useState<any[]>(init); const [slot, setSlot] = useState(cur?.slotMinutes || 30); const [e, setE] = useState(""); const [b, setB] = useState(false);
  const get = (d: number) => days.find(x => x.day === d);
  const toggle = (d: number) => setDays(get(d) ? days.filter(x => x.day !== d) : [...days, { day: d, from: "09:00", to: "20:00" }].sort((a, b) => a.day - b.day));
  const upd = (d: number, k: string, v: string) => setDays(days.map(x => x.day === d ? { ...x, [k]: v } : x));
  const save = async () => { setB(true); setE(""); try { if (!days.length) throw new Error("Выберите хотя бы один рабочий день"); await api("/clinic/schedule", { method: "PUT", body: JSON.stringify({ days, slotMinutes: +slot }) }); onDone(); } catch (x) { setE(errMsg(x)); } setB(false); };
  return <div className="space-y-2">
    <div className="text-sm text-mute">Рабочие дни и часы клиники</div>
    {[1, 2, 3, 4, 5, 6, 0].map(d => { const x = get(d); return <div key={d} className="flex items-center gap-2">
      <button type="button" onClick={() => toggle(d)} className={"w-12 py-2 rounded-lg text-sm font-semibold " + (x ? "bg-brand text-white" : "bg-brand-soft text-mute")}>{DAYS[d]}</button>
      {x ? <><input type="time" className={inp + " !w-auto flex-1"} value={x.from} onChange={e => upd(d, "from", e.target.value)} /><span>—</span><input type="time" className={inp + " !w-auto flex-1"} value={x.to} onChange={e => upd(d, "to", e.target.value)} /></> : <span className="text-sm text-mute">выходной</span>}
    </div>; })}
    <label className="block text-sm text-mute pt-2">Длительность приёма</label>
    <select className={inp} value={slot} onChange={e => setSlot(+e.target.value)}>{[15, 20, 30, 40, 45, 60, 90].map(m => <option key={m} value={m}>{m} минут</option>)}</select>
    <Err e={e} /><button type="button" disabled={b} onClick={save} className={btn + " w-full mt-2"}>Сохранить расписание</button>
  </div>;
}

function ChannelsForm({ onDone }: { onDone: () => void }) {
  const [list, setList] = useState<any[]>([]); const [type, setType] = useState("telegram_bot"); const [secret, setSecret] = useState(""); const [e, setE] = useState(""); const [b, setB] = useState(false);
  const load = useCallback(() => api<any[]>("/channels").then(setList).catch(x => setE(errMsg(x))), []); useEffect(() => { load(); }, [load]);
  const connect = async () => { setB(true); setE(""); try { const r: any = await api("/channels", { method: "POST", body: JSON.stringify({ type, secret: secret.trim() }) }); setSecret(""); await load(); if (r?.status !== "connected") setE("Не удалось подключить: " + String(r?.status || "").replace(/^error:\s*/, "")); } catch (x) { setE(errMsg(x)); } setB(false); };
  return <div className="space-y-3">
    {list.length > 0 && <div className="space-y-1">{list.map(c => <div key={c.id} className="flex justify-between text-sm border border-brand-line rounded-xl px-3 py-2"><span>{c.type === "vk" ? "ВКонтакте" : "Telegram"} · {c.title}</span><span className={c.status === "connected" ? "text-okc" : "text-red-600"}>{c.status === "connected" ? "подключён" : "ошибка"}</span></div>)}</div>}
    <div className="flex gap-2">{[["telegram_bot", "Telegram-бот"], ["vk", "ВКонтакте"]].map(([v, l]) => <button key={v} type="button" onClick={() => setType(v)} className={"flex-1 py-2 rounded-xl text-sm font-semibold " + (type === v ? "bg-brand text-white" : "bg-brand-soft text-brand")}>{l}</button>)}</div>
    <div className="text-xs text-mute">{type === "telegram_bot" ? "Создайте бота в @BotFather → /newbot и вставьте выданный токен." : "Сообщество ВК → Управление → Работа с API → Ключи доступа → создайте ключ с правами «сообщения» и вставьте его."}</div>
    <input className={inp} type="password" autoComplete="off" placeholder={type === "telegram_bot" ? "Токен бота" : "Ключ доступа сообщества"} value={secret} onChange={e => setSecret(e.target.value)} />
    <Err e={e} /><div className="flex gap-2"><button type="button" disabled={b || secret.trim().length < 10} onClick={connect} className={btn}>{b ? "Подключаю…" : "Подключить"}</button><button type="button" onClick={onDone} className={btn2}>Готово</button></div>
    <div className="text-xs text-mute">Max, WhatsApp и SMS — скоро.</div>
  </div>;
}

function PatientForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ fullName: "", phone: "", birthDate: "", notes: "" }); const [e, setE] = useState(""); const [b, setB] = useState(false);
  const save = async () => { setB(true); setE(""); try { if (f.phone.replace(/\D/g, "").length < 10) throw new Error("Укажите телефон (10+ цифр)"); const d: any = { fullName: f.fullName, phone: f.phone }; if (f.birthDate) d.birthDate = f.birthDate; if (f.notes) d.notes = f.notes; await api("/patients", { method: "POST", body: JSON.stringify(d) }); onDone(); } catch (x) { setE(errMsg(x)); } setB(false); };
  return <form onSubmit={ev => { ev.preventDefault(); save(); }} className="space-y-3">
    <input className={inp} required minLength={2} placeholder="ФИО пациента" value={f.fullName} onChange={e => setF({ ...f, fullName: e.target.value })} />
    <input className={inp} required type="tel" inputMode="tel" placeholder="Телефон, +7…" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
    <label className="block text-xs text-mute">Дата рождения<input className={inp + " mt-1"} type="date" value={f.birthDate} onChange={e => setF({ ...f, birthDate: e.target.value })} /></label>
    <textarea className={inp} placeholder="Заметки" rows={2} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
    <Err e={e} /><button disabled={b} className={btn + " w-full"}>Добавить пациента</button></form>;
}

const HDR: Record<string, string[]> = { fullName: ["фио", "имя", "пациент", "name", "fullname", "full name"], phone: ["телефон", "тел", "phone", "мобильный"], birthDate: ["дата рождения", "др", "birthdate", "birthday", "дата"], notes: ["заметки", "комментарий", "notes", "примечание"] };
function mapRows(rows: any[][]) {
  if (!rows.length) return [];
  const h = rows[0].map(x => String(x ?? "").trim().toLowerCase()); const idx: Record<string, number> = {};
  for (const k in HDR) idx[k] = h.findIndex(x => HDR[k].includes(x));
  const hasHdr = idx.fullName >= 0 || idx.phone >= 0; const body = hasHdr ? rows.slice(1) : rows;
  if (!hasHdr) { idx.fullName = 0; idx.phone = 1; idx.birthDate = 2; idx.notes = 3; }
  const dt = (v: any) => { if (v == null || v === "") return undefined; if (v instanceof Date) return v.toISOString().slice(0, 10); const s = String(v).trim(); const m = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : s; };
  return body.map(r => ({ fullName: String(r[idx.fullName] ?? "").trim(), phone: String(r[idx.phone] ?? "").trim(), birthDate: idx.birthDate >= 0 ? dt(r[idx.birthDate]) : undefined, notes: idx.notes >= 0 && r[idx.notes] ? String(r[idx.notes]) : undefined })).filter(r => r.fullName.length >= 2 && r.phone);
}
function parseCSV(t: string) { const d = (t.split("\n")[0].match(/;/g) || []).length >= (t.split("\n")[0].match(/,/g) || []).length ? ";" : ","; const out: string[][] = []; let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; } else if (c === '"') q = true; else if (c === d) { row.push(cur); cur = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cur); out.push(row); row = []; cur = ""; } else cur += c; }
  if (cur || row.length) { row.push(cur); out.push(row); } return out.filter(r => r.some(x => x.trim())); }

function ImportForm({ onDone, onManual }: { onDone: () => void; onManual: () => void }) {
  const [rows, setRows] = useState<any[]>([]); const [e, setE] = useState(""); const [b, setB] = useState(false); const [res, setRes] = useState<any>(null);
  const onFile = async (f?: File) => { setE(""); setRes(null); if (!f) return; try {
    let raw: any[][];
    if (/\.(xlsx|xls)$/i.test(f.name)) { const X = await import("xlsx"); const wb = X.read(await f.arrayBuffer(), { type: "array", cellDates: true }); raw = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true }) as any[][]; }
    else { const buf = await f.arrayBuffer(); let t = new TextDecoder("utf-8").decode(buf); if (t.includes("\uFFFD")) t = new TextDecoder("windows-1251").decode(buf); raw = parseCSV(t.replace(/^\uFEFF/, "")); }
    const m = mapRows(raw); if (!m.length) throw new Error("Не нашёл строк с ФИО и телефоном"); setRows(m);
  } catch (x) { setE(errMsg(x)); } };
  const go = async () => { setB(true); setE(""); try { let created = 0, skipped = 0; const errors: string[] = []; for (let i = 0; i < rows.length; i += 1000) { const r: any = await api("/patients/import", { method: "POST", body: JSON.stringify({ rows: rows.slice(i, i + 1000) }) }); created += r.created; skipped += r.skipped; errors.push(...r.errors); } setRes({ created, skipped, errors }); setRows([]); } catch (x) { setE(errMsg(x)); } setB(false); };
  return <div className="space-y-3">
    <div className="text-sm text-mute">Файл CSV или Excel (.xlsx). Колонки: <b>ФИО</b>, <b>Телефон</b>, Дата рождения, Заметки. Дубли по телефону пропускаются.</div>
    <label className={btn2 + " block text-center cursor-pointer"}>📄 Выбрать файл<input type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" onChange={e => onFile(e.target.files?.[0])} /></label>
    {rows.length > 0 && <div className="border border-brand-line rounded-xl p-3 text-sm"><b>Найдено: {rows.length}</b>{rows.slice(0, 3).map((r, i) => <div key={i} className="text-mute truncate">{r.fullName} · {r.phone}</div>)}<button type="button" disabled={b} onClick={go} className={btn + " w-full mt-2"}>{b ? "Импортирую…" : `Импортировать ${rows.length}`}</button></div>}
    {res && <div className="bg-okbg text-okc rounded-xl p-3 text-sm">Добавлено: {res.created}{res.skipped ? `, пропущено дублей: ${res.skipped}` : ""}{res.errors.length ? `, ошибок: ${res.errors.length}` : ""}</div>}
    <Err e={e} />
    <div className="flex gap-2"><button type="button" onClick={onManual} className={btn2 + " flex-1"}>+ Добавить вручную</button>{res && <button type="button" onClick={onDone} className={btn + " flex-1"}>Готово</button>}</div>
  </div>;
}

function ApptForm({ onDone }: { onDone: () => void }) {
  const [docs, setDocs] = useState<any[]>([]); const [pts, setPts] = useState<any[]>([]); const [f, setF] = useState({ doctorId: "", patientId: "", date: new Date().toISOString().slice(0, 10), time: "10:00", minutes: 30, service: "" }); const [e, setE] = useState(""); const [b, setB] = useState(false);
  useEffect(() => { api<any[]>("/doctors").then(d => { setDocs(d); if (d[0]) setF(f => ({ ...f, doctorId: d[0].id })); }); api<any[]>("/patients").then(setPts); }, []);
  const save = async () => { setB(true); setE(""); try { await api("/appointments", { method: "POST", body: JSON.stringify({ doctorId: f.doctorId, patientId: f.patientId, startsAt: new Date(`${f.date}T${f.time}:00+03:00`).toISOString(), minutes: +f.minutes, service: f.service || undefined }) }); onDone(); } catch (x) { setE(errMsg(x)); } setB(false); };
  if (!docs.length || !pts.length) return <div className="text-sm text-mute">Чтобы записать пациента, сначала добавьте {!docs.length ? "врача" : ""}{!docs.length && !pts.length ? " и " : ""}{!pts.length ? "пациента" : ""}.</div>;
  return <div className="space-y-3">
    <select className={inp} value={f.doctorId} onChange={e => setF({ ...f, doctorId: e.target.value })}>{docs.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}</select>
    <select className={inp} value={f.patientId} onChange={e => setF({ ...f, patientId: e.target.value })}><option value="">Выберите пациента</option>{pts.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}</select>
    <div className="flex gap-2"><input type="date" className={inp} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /><input type="time" className={inp} value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /></div>
    <input className={inp} placeholder="Услуга (необязательно)" value={f.service} onChange={e => setF({ ...f, service: e.target.value })} />
    <Err e={e} /><button type="button" disabled={b || !f.patientId} onClick={save} className={btn + " w-full"}>Записать</button></div>;
}

function Checklist({ onb, open, compact, onToggle, onStep }: { onb: Onb; open: boolean; compact?: boolean; onToggle?: () => void; onStep: (s: typeof STEPS[number]) => void }) {
  const done = STEPS.filter(s => onb[s[0]]).length;
  return <div className="bg-white rounded-card shadow-card p-4 md:p-5 max-w-2xl">
    <button type="button" onClick={onToggle} disabled={!compact} className="w-full flex justify-between items-center text-left"><b>Чек-лист запуска</b><span className="text-sm text-mute">{done} из 4 {compact && (open ? "▴" : "▾")}</span></button>
    <div className="h-2 bg-brand-soft rounded-full my-3"><div className="h-2 bg-brand rounded-full transition-all" style={{ width: done * 25 + "%" }} /></div>
    {open && STEPS.map(s => { const ok = onb[s[0]]; return <div key={s[0]} className="flex items-center gap-3 py-3 border-t border-brand-line">
      <span className={"w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg " + (ok ? "bg-okbg" : "bg-brand-soft")}>{ok ? "✅" : s[1]}</span>
      <div className="flex-1 min-w-0"><b className={ok ? "line-through text-mute" : ""}>{s[2]}</b><div className="text-xs text-mute">{s[3]}</div></div>
      <button type="button" onClick={() => onStep(s)} className={ok ? btn2 + " !px-3 !py-2 text-sm" : btn + " !px-3 !py-2 text-sm"}>{ok ? "Открыть" : "Начать"}</button></div>; })}
  </div>;
}

const NAV: [Sec, string, string][] = [["home", "🏠", "Главная"], ["schedule", "📅", "Расписание"], ["patients", "👥", "Пациенты"], ["chat", "💬", "Диалоги"], ["doctors", "👩‍⚕️", "Врачи"], ["settings", "⚙️", "Настройки"]];
const fmt = (s: string) => new Date(s).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });

export function RealCRM({ onLogout }: { onLogout: () => void }) {
  const [sec, setSec] = useState<Sec>("home"); const [modal, setModal] = useState<Modal>(null); const [edit, setEdit] = useState<any>(null);
  const [onb, setOnb] = useState<Onb | null>(null); const [skip, setSkip] = useState(false); const [open, setOpen] = useState(true);
  const [clinic, setClinic] = useState<any>(null); const [docs, setDocs] = useState<any[]>([]); const [pts, setPts] = useState<any[]>([]); const [appts, setAppts] = useState<any[]>([]); const [convs, setConvs] = useState<any[]>([]); const [chs, setChs] = useState<any[]>([]); const [q, setQ] = useState(""); const [err, setErr] = useState("");
  const refresh = useCallback(async () => { setErr(""); try {
    const [o, c, d, p, a, cv, ch] = await Promise.all([api<Onb>("/onboarding"), api("/clinic"), api<any[]>("/doctors"), api<any[]>("/patients"), api<any[]>("/appointments"), api<any[]>("/conversations").catch(() => []), api<any[]>("/channels").catch(() => [])]);
    setOnb(o); setClinic(c); setDocs(d); setPts(p); setAppts(a); setConvs(cv); setChs(ch);
  } catch (x: any) { if (/вход/i.test(x?.message)) { logout(); onLogout(); } else setErr(errMsg(x)); } }, [onLogout]);
  useEffect(() => { setSkip(localStorage.getItem("crm-onb-skip") === "1"); setOpen(localStorage.getItem("crm-onb-open") !== "0"); refresh(); }, [refresh]);
  const close = () => { setModal(null); setEdit(null); refresh(); };
  const goStep = (s: typeof STEPS[number]) => { setSec(s[4]); setModal(s[5]); };
  const doSkip = () => { localStorage.setItem("crm-onb-skip", "1"); setSkip(true); setSec("home"); };
  const toggle = () => { localStorage.setItem("crm-onb-open", open ? "0" : "1"); setOpen(!open); };
  const out = () => { logout(); localStorage.removeItem("crm-onb-skip"); onLogout(); };
  const name = clinic?.name || (typeof window !== "undefined" ? localStorage.getItem("crm-clinic") : "") || "Ваша клиника";
  const allDone = !!onb && STEPS.every(s => onb[s[0]]);
  const sched = clinic?.settings?.schedule;
  const modals = <>
    {modal === "doctor" && <Sheet title={edit ? "Изменить врача" : "Добавить врача"} onClose={close}><DoctorForm doc={edit} onDone={close} /></Sheet>}
    {modal === "schedule" && <Sheet title="Расписание клиники" onClose={close}><ScheduleForm cur={sched} onDone={close} /></Sheet>}
    {modal === "channels" && <Sheet title="Каналы связи" onClose={close}><ChannelsForm onDone={close} /></Sheet>}
    {modal === "import" && <Sheet title="Импорт пациентов" onClose={close}><ImportForm onDone={close} onManual={() => setModal("patient")} /></Sheet>}
    {modal === "patient" && <Sheet title="Новый пациент" onClose={close}><PatientForm onDone={close} /></Sheet>}
    {modal === "appt" && <Sheet title="Новая запись" onClose={close}><ApptForm onDone={close} /></Sheet>}
  </>;

  if (!onb && !err) return <div className="min-h-screen flex items-center justify-center text-mute">Загрузка…</div>;
  if (onb && !skip && !allDone) return <div className="min-h-screen bg-brand-bg p-4 md:p-8 pb-10">
    <div className="flex justify-between items-center mb-4 max-w-2xl"><b className="text-brand">◆ {name}</b><button type="button" onClick={out} className="text-sm text-mute underline">Выйти</button></div>
    <h1 className="text-2xl font-bold mb-1">Добро пожаловать! 👋</h1><p className="text-mute mb-5">CRM пока пустая. Пройдите 4 шага — и можно принимать пациентов.</p>
    <Checklist onb={onb} open onStep={goStep} />
    <div className="max-w-2xl mt-4"><button type="button" onClick={doSkip} className={btn2 + " w-full"}>Пропустить, заполню позже →</button></div>
    {modals}</div>;

  const Empty = ({ t, a, onA }: { t: string; a: string; onA: () => void }) => <div className="bg-white rounded-card shadow-card p-6 text-center"><div className="text-mute mb-3">{t}</div><button type="button" onClick={onA} className={btn}>{a}</button></div>;
  const H = ({ t, a, onA }: { t: string; a?: string; onA?: () => void }) => <div className="flex justify-between items-center mb-4 gap-2"><h1 className="text-xl md:text-2xl font-bold">{t}</h1>{a && <button type="button" onClick={onA} className={btn + " !py-2 text-sm"}>{a}</button>}</div>;
  const fp = pts.filter(p => !q || p.fullName.toLowerCase().includes(q.toLowerCase()) || p.phone.includes(q.replace(/\D/g, "")));
  return <div className="md:flex min-h-screen bg-brand-bg">
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-brand-line p-4 gap-1 sticky top-0 h-screen"><div className="font-extrabold text-lg text-brand mb-5 truncate">◆ {name}</div>
      {NAV.map(([k, i, l]) => <button type="button" key={k} onClick={() => setSec(k)} className={"text-left px-3 py-2.5 rounded-xl " + (sec === k ? "bg-brand-soft text-brand font-semibold" : "text-[#5C4E78]")}>{i} {l}</button>)}
      <button type="button" onClick={out} className="mt-auto text-sm text-mute underline text-left">Выйти (вернуться в демо)</button></aside>
    <main className="flex-1 min-w-0 p-4 md:p-8 pb-24 md:pb-8">
      <div className="md:hidden flex justify-between mb-4"><b className="text-brand truncate">◆ {name}</b><button type="button" onClick={out} className="text-sm text-mute underline">Выйти</button></div>
      {err && <Err e={err} />}
      {onb && !allDone && sec !== "home" && <div className="mb-4"><Checklist onb={onb} open={open} compact onToggle={toggle} onStep={goStep} /></div>}
      {sec === "home" && <div className="space-y-4"><H t="Главная" />
        {onb && !allDone && <Checklist onb={onb} open={open} compact onToggle={toggle} onStep={goStep} />}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">{[["Врачи", docs.length, "doctors"], ["Пациенты", pts.length, "patients"], ["Записи", appts.length, "schedule"], ["Диалоги", convs.length, "chat"]].map(([l, n, s]) => <button type="button" key={l as string} onClick={() => setSec(s as Sec)} className="bg-white rounded-card shadow-card p-4 text-left"><div className="text-2xl font-bold">{n as number}</div><div className="text-sm text-mute">{l}</div></button>)}</div></div>}
      {sec === "schedule" && <div><H t="Расписание" a="+ Запись" onA={() => setModal("appt")} />
        <div className="bg-white rounded-card shadow-card p-4 mb-4 flex justify-between items-center gap-2"><div className="text-sm">{sched ? <>Работаем: {sched.days.map((d: any) => `${DAYS[d.day]} ${d.from}–${d.to}`).join(", ")} · приём {sched.slotMinutes} мин</> : <span className="text-mute">Рабочие часы не настроены</span>}</div><button type="button" onClick={() => setModal("schedule")} className={btn2 + " !py-2 text-sm shrink-0"}>Настроить</button></div>
        {appts.length ? <div className="bg-white rounded-card shadow-card divide-y divide-brand-line">{appts.map(a => <div key={a.id} className="p-3 flex justify-between gap-2 text-sm"><div><b>{fmt(a.startsAt)}</b> · {a.patient?.fullName}</div><div className="text-mute text-right">{a.doctor?.name}{a.service ? ` · ${a.service}` : ""}</div></div>)}</div> : <Empty t="Записей пока нет" a="Записать пациента" onA={() => setModal("appt")} />}</div>}
      {sec === "patients" && <div><H t="Пациенты" a="+ Пациент" onA={() => setModal("patient")} />
        <div className="flex gap-2 mb-3"><input className={inp} placeholder="Поиск по ФИО или телефону" value={q} onChange={e => setQ(e.target.value)} /><button type="button" onClick={() => setModal("import")} className={btn2 + " shrink-0 text-sm"}>Импорт</button></div>
        {fp.length ? <div className="bg-white rounded-card shadow-card divide-y divide-brand-line">{fp.map(p => <div key={p.id} className="p-3 flex justify-between gap-2 text-sm"><b className="truncate">{p.fullName}</b><span className="text-mute shrink-0">{p.phone}</span></div>)}</div> : <Empty t={pts.length ? "Ничего не найдено" : "Пациентов пока нет"} a="Импортировать из файла" onA={() => setModal("import")} />}</div>}
      {sec === "chat" && <div><H t="Диалоги" />
        {convs.length ? <div className="bg-white rounded-card shadow-card divide-y divide-brand-line">{convs.map(c => <div key={c.id} className="p-3 flex justify-between text-sm"><b>{c.patient?.fullName || "Без имени"}</b>{c.unread > 0 && <span className="bg-brand text-white rounded-full px-2 text-xs">{c.unread}</span>}</div>)}</div>
          : <Empty t={chs.length ? "Сообщений от пациентов пока нет — они появятся здесь" : "Подключите Telegram-бота или сообщество ВК, чтобы получать сообщения пациентов"} a={chs.length ? "Каналы" : "Подключить канал"} onA={() => setModal("channels")} />}</div>}
      {sec === "doctors" && <div><H t="Врачи" a="+ Врач" onA={() => setModal("doctor")} />
        {docs.length ? <div className="bg-white rounded-card shadow-card divide-y divide-brand-line">{docs.map(d => <div key={d.id} className="p-3 flex justify-between items-center gap-2 text-sm"><div className="min-w-0"><b>{d.name}</b><div className="text-mute">{d.specialty}{d.room ? ` · каб. ${d.room}` : ""}</div></div>
          <div className="flex gap-1 shrink-0"><button type="button" onClick={() => { setEdit(d); setModal("doctor"); }} className={btn2 + " !px-3 !py-1.5 text-sm"}>Изм.</button><button type="button" onClick={async () => { if (!confirm(`Удалить ${d.name}?`)) return; try { await api(`/doctors/${d.id}`, { method: "DELETE" }); refresh(); } catch (x) { alert(errMsg(x)); } }} className="px-3 py-1.5 text-sm text-red-600">✕</button></div></div>)}</div> : <Empty t="Врачей пока нет" a="Добавить врача" onA={() => setModal("doctor")} />}</div>}
      {sec === "settings" && <div className="space-y-3 max-w-2xl"><H t="Настройки" />
        {[["📅 Расписание клиники", sched ? `${sched.days.length} раб. дней · приём ${sched.slotMinutes} мин` : "Не настроено", "schedule"], ["🔌 Каналы связи", chs.length ? chs.map(c => c.title).join(", ") : "Не подключены", "channels"], ["👥 Импорт пациентов", "CSV / Excel", "import"]].map(([t, d, m]) => <button type="button" key={m} onClick={() => setModal(m as Modal)} className="w-full bg-white rounded-card shadow-card p-4 flex justify-between items-center text-left"><div><b>{t}</b><div className="text-sm text-mute">{d}</div></div><span className="text-brand">›</span></button>)}
        {skip && !allDone && <button type="button" onClick={() => { localStorage.removeItem("crm-onb-skip"); setSkip(false); }} className="text-sm text-brand underline">Показать экран приветствия снова</button>}</div>}
    </main>
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-brand-line flex pb-[env(safe-area-inset-bottom)]">{NAV.map(([k, i, l]) => <button type="button" key={k} onClick={() => setSec(k)} className={"flex-1 py-2 text-[10px] flex flex-col items-center " + (sec === k ? "text-brand font-semibold" : "text-mute")}><span className="text-lg leading-5">{i}</span>{l}</button>)}</nav>
    {modals}</div>;
}
