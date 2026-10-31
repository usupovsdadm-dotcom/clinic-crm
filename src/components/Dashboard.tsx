"use client";
import { DB, short, ymd, addDays } from "@/lib/store";
const rub = (n: number) => n.toLocaleString("ru") + " ₽";
export default function Dashboard({ db }: { db: DB }) {
  const today = ymd(new Date()); const from = addDays(today, -30);
  const per = db.appts.filter(a => a.date >= from && a.date <= today);
  const prev = db.appts.filter(a => a.date >= addDays(from, -30) && a.date < from);
  const rev = (l: typeof per) => l.filter(a => a.status === "paid").reduce((s, a) => s + a.price, 0);
  const R = rev(per), P = rev(prev); const workdays = new Set(per.map(a => a.date)).size || 1;
  const cap = db.doctors.length * workdays * 11 * 60; const busy = per.filter(a => a.status !== "noshow").reduce((s, a) => s + a.dur, 0);
  const noshow = per.filter(a => a.status === "noshow").length / (per.length || 1) * 100;
  const firstSeen: Record<string, string> = {}; db.appts.forEach(a => { if (!firstSeen[a.pid] || a.date < firstSeen[a.pid]) firstSeen[a.pid] = a.date; });
  const online = per.filter(a => a.online).length / (per.length || 1) * 100;
  const weeks = Array.from({ length: 5 }, (_, i) => { const s = addDays(today, -35 + i * 7), e = addDays(s, 7); return { label: s.slice(8) + "." + s.slice(5, 7), v: rev(db.appts.filter(a => a.date >= s && a.date < e)) }; });
  const mx = Math.max(...weeks.map(w => w.v), 1);
  const docs = db.doctors.map(d => { const l = per.filter(a => a.did === d.id); return { d, rev: rev(l), load: Math.round(l.filter(a => a.status !== "noshow").reduce((s, a) => s + a.dur, 0) / (workdays * 660) * 100) }; }).sort((a, b) => b.rev - a.rev);
  const src: Record<string, number> = {}; per.forEach(a => { const s = db.patients.find(p => p.id === a.pid)?.source || "—"; src[s] = (src[s] || 0) + 1; });
  const K = ({ t, v, c }: { t: string; v: string; c: React.ReactNode }) => <div className="card"><span className="text-mute">{t}</span><b className="block text-2xl my-1">{v}</b>{c}</div>;
  return <div><div className="flex justify-between items-center mb-4 flex-wrap gap-2"><h1 className="text-2xl font-bold">Аналитика · последние 30 дней</h1>
    <button className="btn-g" onClick={() => { const csv = "Врач;Выручка;Загрузка\n" + docs.map(x => `${short(x.d)};${x.rev};${x.load}%`).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" })); a.download = "analytics.csv"; a.click(); }}>Выгрузить CSV</button></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <K t="Выручка" v={rub(R)} c={<span className={`chip ${R >= P ? "!bg-okbg !text-okc" : "!bg-red-50 !text-red-500"}`}>{P ? (R >= P ? "+" : "") + Math.round((R - P) / P * 100) + "% к пред. 30 дн." : "—"}</span>} />
      <K t="Загрузка врачей" v={Math.round(busy / cap * 100) + "%"} c={<span className="chip">цель 85%</span>} />
      <K t="Неявки" v={noshow.toFixed(1).replace(".", ",") + "%"} c={<span className="text-mute text-xs">{per.filter(a => a.status === "noshow").length} визитов</span>} />
      <K t="Новые пациенты" v={String(Object.values(firstSeen).filter(d => d >= from && d <= today).length)} c={<span className="text-mute text-xs">{Math.round(online)}% записей онлайн</span>} />
    </div>
    <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
      <div className="card"><h2 className="font-bold mb-3">Выручка по неделям</h2><div className="flex items-end gap-3 h-48">{weeks.map(w => <div key={w.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end"><span className="text-xs text-mute">{Math.round(w.v / 1000)}т</span><div className="w-full rounded-t-xl bg-gradient-to-b from-[#8B6BE0] to-brand" style={{ height: `${w.v / mx * 80}%` }} /><span className="text-xs text-mute">{w.label}</span></div>)}</div></div>
      <div className="card"><h2 className="font-bold mb-2">Врачи · выручка / загрузка</h2>{docs.map(x => <div key={x.d.id} className="py-1.5"><div className="flex justify-between"><span>{short(x.d)}</span><b>{rub(x.rev)}</b></div><div className="h-1.5 bg-brand-soft rounded-full mt-1"><div className="h-full bg-brand rounded-full" style={{ width: Math.min(x.load, 100) + "%" }} /></div><span className="text-xs text-mute">загрузка {x.load}%</span></div>)}
        <h2 className="font-bold mt-3 mb-1">Источники</h2><p className="text-mute text-xs">{Object.entries(src).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${Math.round(v / per.length * 100)}%`).join(" · ")}</p></div></div></div>;
}
