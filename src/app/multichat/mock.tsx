"use client";
import { useEffect, useState } from "react";
import * as A from "./ai";
import { Sheet, MobileAttach, Editor } from "./attach";
const P = "#6C4AD4";
const CH: Record<string, { l: string; c: string; n: string }> = {
  tg: { l: "T", c: "#2AA3DF", n: "Telegram" }, vk: { l: "В", c: "#0077FF", n: "ВКонтакте" },
  mx: { l: "М", c: "#8B3DFF", n: "Макс" }, wa: { l: "W", c: "#25D366", n: "WhatsApp" }, sms: { l: "S", c: "#64748B", n: "SMS" } };
const B = ({ ch, s = 18 }: { ch: string; s?: number }) => <span style={{ background: CH[ch].c, width: s, height: s, fontSize: s * .55 }} className="inline-flex items-center justify-center rounded-full text-white font-bold shrink-0">{CH[ch].l}</span>;
const chats = [
  { n: "Анна Смирнова", ch: "tg", t: "10:42", m: "Можно перенести запись на пятницу?", u: 2, a: "Мария (админ)" },
  { n: "Игорь Петров", ch: "wa", t: "10:31", m: "Спасибо, результаты получил", u: 0, a: "Ольга" },
  { n: "Елена Кузнецова", ch: "vk", t: "10:05", m: "Сколько стоит консультация кардиолога?", u: 1, a: "—" },
  { n: "Дмитрий Орлов", ch: "mx", t: "09:48", m: "Подтверждаю запись на завтра", u: 0, a: "Мария (админ)" },
  { n: "Ольга Волкова", ch: "tg", t: "09:12", m: "Фото анализов во вложении", u: 3, a: "Ольга" },
  { n: "Сергей Морозов", ch: "vk", t: "Вчера", m: "Вы работаете в субботу?", u: 0, a: "—" },
  { n: "Наталья Лебедева", ch: "wa", t: "Вчера", m: "Шаблон: напоминание о визите", u: 0, a: "Мария (админ)" },
  { n: "Павел Соколов", ch: "mx", t: "Пн", m: "Где взять направление?", u: 0, a: "Ольга" }];
const msgs = [
  { me: 0, ch: "tg", t: "10:20", x: "Здравствуйте! Я записана к Иванову на четверг 14:00" },
  { me: 1, ch: "tg", t: "10:22", x: "Здравствуйте, Анна! Да, вижу вашу запись: чт, 6 ноября, 14:00, терапевт Иванов А.В.", s: "✓✓ прочитано" },
  { me: 0, ch: "wa", t: "10:35", x: "Писала вам ещё в WhatsApp, продублирую тут 🙂" },
  { me: 0, ch: "tg", t: "10:42", x: "Можно перенести запись на пятницу? Лучше после 16:00" },
  { me: 1, ch: "tg", t: "10:44", x: "Сейчас подберу время, минуту", s: "✓ доставлено" }];
export function Inbox({ mobile, conv }: { mobile?: boolean; conv?: boolean }) {
  const list = <div className={`${mobile ? "w-full" : "w-[330px] border-r"} bg-white flex flex-col h-full`}>
    <div className="p-3 border-b space-y-2">
      <div className="flex items-center justify-between"><b className="text-lg">Мультичат</b><span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">6 непрочит.</span></div>
      <input className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm" placeholder="🔍 Поиск по имени, телефону, тексту" />
      <div className="flex gap-1 text-xs flex-wrap">{["Все", "Непрочитанные", "Мои"].map((f, i) => <span key={f} className={`px-2.5 py-1 rounded-full ${i == 0 ? "text-white" : "bg-slate-100"}`} style={i == 0 ? { background: P } : {}}>{f}</span>)}
        <span className="px-2 py-1 rounded-full bg-slate-100 flex gap-1 items-center">Канал: {["tg", "vk", "mx", "wa"].map(c => <B key={c} ch={c} s={14} />)}</span></div></div>
    <div className="overflow-hidden flex-1">{chats.map((c, i) => <div key={i} className={`flex gap-3 px-3 py-2.5 border-b ${i == 0 && !mobile ? "bg-violet-50 border-l-4" : ""}`} style={i == 0 && !mobile ? { borderLeftColor: P } : {}}>
      <div className="relative"><div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-600">{c.n.split(" ").map(w => w[0]).join("")}</div><span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white rounded-full"><B ch={c.ch} s={16} /></span></div>
      <div className="flex-1 min-w-0"><div className="flex justify-between"><b className="text-sm truncate">{c.n}</b><span className="text-xs text-slate-400">{c.t}</span></div>
        <div className="flex justify-between gap-2"><span className="text-sm text-slate-500 truncate">{c.m}</span>{c.u > 0 && <span className="text-[11px] text-white rounded-full px-1.5 min-w-5 text-center" style={{ background: P }}>{c.u}</span>}</div>
        <div className="text-[11px] text-slate-400">👤 {c.a}</div></div></div>)}</div></div>;
  const chat = <div className="flex-1 flex flex-col bg-slate-50 h-full min-w-0">
    <div className="bg-white border-b px-4 py-3 flex items-center gap-3">{mobile && <span className="text-xl">‹</span>}<div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-semibold">АС</div>
      <div className="flex-1"><b>Анна Смирнова</b><div className="text-xs text-slate-500 flex items-center gap-1">Отвечать в: <B ch="tg" s={14} /> Telegram ▾ · ответственный: Мария</div></div>
      {!mobile && <button className="text-sm border rounded-lg px-3 py-1.5">Назначить</button>}<button className="text-sm text-white rounded-lg px-3 py-1.5" style={{ background: P }}>{mobile ? "📅" : "📅 Записать на приём"}</button></div>
    <div className="flex-1 p-4 space-y-3 overflow-hidden">
      <div className="text-center text-xs text-slate-400">Сегодня · история из Telegram и WhatsApp объединена</div>
      {msgs.map((m, i) => <div key={i} className={`flex ${m.me ? "justify-end" : ""}`}><div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${m.me ? "text-white" : "bg-white"}`} style={m.me ? { background: P } : {}}>
        <div className="flex items-center gap-1 text-[11px] opacity-70 mb-0.5"><B ch={m.ch} s={12} />{CH[m.ch].n}</div>{m.x}
        <div className="text-[11px] opacity-70 text-right">{m.t} {m.s || ""}</div></div></div>)}
      <div className="flex justify-end"><div className="bg-white border-2 border-dashed rounded-xl p-3 text-sm w-72" style={{ borderColor: P }}>
        <b>📅 Запись на приём</b><div className="text-slate-500 text-xs mb-2">Терапевт Иванов А.В. · пт, 7 ноября</div>
        <div className="flex gap-1">{["16:00", "16:30", "17:30"].map((t, i) => <span key={t} className={`px-2 py-1 rounded text-xs ${i == 0 ? "text-white" : "bg-slate-100"}`} style={i == 0 ? { background: P } : {}}>{t}</span>)}</div>
        <button className="mt-2 w-full text-white rounded-lg py-1 text-xs" style={{ background: P }}>Перенести и отправить подтверждение</button></div></div></div>
    <div className="bg-white border-t p-3 space-y-2">
      <div className="flex gap-1 text-xs overflow-hidden">{["Подтверждаю запись", "Адрес клиники", "Подготовка к анализам", "Прайс", "⚡ Шаблоны"].map(q => <span key={q} className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 whitespace-nowrap">{q}</span>)}</div>
      <div className="flex gap-2 items-center"><span className="text-xl">📎</span><input className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-sm" placeholder="Сообщение в Telegram… {имя} подставится" /><button className="text-white rounded-lg px-4 py-2 text-sm" style={{ background: P }}>➤</button></div></div></div>;
  const card = <div className="w-[300px] bg-white border-l p-4 space-y-4 text-sm h-full overflow-hidden">
    <div className="text-center"><div className="w-16 h-16 mx-auto rounded-full bg-violet-100 flex items-center justify-center text-xl font-bold text-violet-700">АС</div><b className="block mt-2">Смирнова Анна Викторовна</b><span className="text-slate-500">34 года · карта №10482</span></div>
    <div><div className="text-xs text-slate-400">Телефон</div>+7 (9••) •••-••-47 <span className="text-[11px] text-slate-400">(скрыт для врачей)</span></div>
    <div className="rounded-lg bg-violet-50 p-3"><div className="text-xs text-slate-500">Ближайшая запись</div><b>чт, 6 ноября, 14:00</b><div>Терапевт Иванов А.В., каб. 3</div></div>
    <div><div className="text-xs text-slate-400 mb-1">История визитов</div>{[["12.09", "Терапевт", "Иванов"], ["03.07", "Анализы", "Лаборатория"], ["15.04", "Кардиолог", "Сергеева"]].map(v => <div key={v[0]} className="flex justify-between py-0.5"><span>{v[0]} · {v[1]}</span><span className="text-slate-400">{v[2]}</span></div>)}</div>
    <div><div className="text-xs text-slate-400 mb-1">Каналы пациента (объединены по телефону)</div>{[["tg", "@anna_sm", "активен"], ["wa", "+7 9•• ••• 47", "активен"], ["vk", "vk.com/id•••", "не писала"]].map(c => <div key={c[0]} className="flex items-center gap-2 py-0.5"><B ch={c[0]} /> <span className="flex-1">{c[1]}</span><span className="text-xs text-slate-400">{c[2]}</span></div>)}</div>
    <div className="flex items-center justify-between border rounded-lg p-2"><div><b className="text-xs">Согласие на рассылки</b><div className="text-[11px] text-slate-400">152-ФЗ · получено 12.09.2026</div></div><span className="w-10 h-6 rounded-full relative" style={{ background: P }}><span className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full" /></span></div></div>;
  if (mobile) return <div className="h-full flex flex-col">{conv ? chat : <>{list}<Nav /></>}</div>;
  return <div className="flex h-full">{list}{chat}{card}</div>;
}
const Nav = () => <div className="flex justify-around border-t bg-white py-2 text-xs text-slate-500">{["📊 Главная", "📅 Расписание", "💬 Чаты", "👥 Пациенты"].map(n => <span key={n} style={n.includes("Чаты") ? { color: P, fontWeight: 600 } : {}}>{n}</span>)}</div>;
const Card = ({ children, t }: any) => <div className="bg-white rounded-xl border p-4"><b className="block mb-3">{t}</b>{children}</div>;
export function Mailing() {
  return <div className="p-6 grid grid-cols-3 gap-4 h-full overflow-hidden text-sm">
    <div className="space-y-4"><Card t="1. Сегмент">{[["Записаны на завтра", 42, 1], ["Не были 6 месяцев", 318, 0], ["День рождения на этой неделе", 17, 0], ["Свой фильтр…", null, 0]].map(([n, c, a]: any) => <label key={n} className={`flex justify-between items-center p-2 rounded-lg mb-1 ${a ? "bg-violet-50 ring-1" : "bg-slate-50"}`} style={a ? { ["--tw-ring-color" as any]: P } : {}}><span>{a ? "◉" : "○"} {n}</span><span className="text-slate-400">{c ?? "＋"}</span></label>)}
      <div className="text-xs text-slate-500 mt-2">Только пациенты с согласием 152-ФЗ: 39 из 42</div></Card>
      <Card t="2. Приоритет каналов">{[["tg", "Telegram", 21], ["vk", "ВКонтакте", 7], ["mx", "Макс", 4], ["wa", "WhatsApp — шаблон", 5], ["sms", "SMS (резерв)", 2]].map(([c, n, k]: any, i) => <div key={c} className="flex items-center gap-2 py-1"><span className="text-slate-300">⠿</span><span className="text-slate-400 w-3">{i + 1}</span><B ch={c} /><span className="flex-1">{n}</span><span className="text-slate-500">{k} чел.</span></div>)}
        <div className="text-xs text-slate-500 mt-1">Если канала нет у пациента — следующий по списку</div></Card></div>
    <div className="space-y-4"><Card t="3. Сообщение"><div className="flex gap-1 mb-2">{["{имя}", "{дата}", "{врач}", "{время}", "{адрес}"].map(v => <span key={v} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded">{v}</span>)}</div>
      <div className="border rounded-lg p-3 h-36 leading-relaxed">Здравствуйте, <span className="text-violet-700">{"{имя}"}</span>! Напоминаем о приёме <span className="text-violet-700">{"{дата}"}</span> у врача <span className="text-violet-700">{"{врач}"}</span>. Ответьте «Да» для подтверждения или «Перенос» — подберём другое время.</div>
      <div className="text-xs text-slate-400 mt-1">186 / 1000 символов · SMS: 2 сегмента</div></Card>
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs"><b>⚠️ Telegram: рассылка с паузами</b><br />Аккаунт клиники отправляет не более 1 сообщения в 20–40 с, сначала тем, кто уже писал клинике. 21 сообщение ≈ 12 мин. Защищает номер от блокировки.</div>
      <div className="rounded-xl border p-3 text-xs flex items-center gap-2"><B ch="wa" /><div className="flex-1"><b>Шаблон WhatsApp «visit_reminder»</b><div className="text-slate-500">через провайдера Business API · ≈ 4,2 ₽ / сообщение</div></div><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Одобрен</span></div></div>
    <div className="space-y-4"><Card t="Превью по каналам"><div className="flex gap-1 mb-3">{["tg", "vk", "mx", "wa", "sms"].map((c, i) => <span key={c} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${i == 0 ? "bg-violet-100" : "bg-slate-50"}`}><B ch={c} s={14} />{CH[c].n.slice(0, 5)}</span>)}</div>
      <div className="bg-[#DCEBF7] rounded-xl p-3"><div className="bg-white rounded-xl p-2.5 shadow-sm">Здравствуйте, Анна! Напоминаем о приёме 6 ноября в 14:00 у врача Иванов А.В. Ответьте «Да» для подтверждения или «Перенос» — подберём другое время.<div className="text-right text-[11px] text-slate-400">18:00 ✓✓</div></div></div></Card>
      <Card t="Отправка"><div className="text-3xl font-bold" style={{ color: P }}>39</div><div className="text-slate-500 mb-3">получателей · ≈ 21 ₽ за WhatsApp и SMS</div>
        <div className="flex gap-2 mb-3"><span className="flex-1 border rounded-lg p-2">○ Сейчас</span><span className="flex-1 border-2 rounded-lg p-2" style={{ borderColor: P }}>◉ 05.11, 18:00</span></div>
        <button className="w-full text-white rounded-lg py-2.5 font-semibold" style={{ background: P }}>Запланировать рассылку</button><button className="w-full mt-2 border rounded-lg py-2">Отправить тест себе</button></Card></div></div>;
}
export function Channels() {
  const S = ({ s }: { s: string }) => { const m: any = { "Подключено": "bg-green-100 text-green-700", "Ожидает проверки": "bg-amber-100 text-amber-700", "Не подключено": "bg-slate-100 text-slate-500" }; return <span className={`text-xs px-2 py-0.5 rounded-full ${m[s]}`}>{s}</span>; };
  const cards = [
    { c: "tg", t: "Telegram", s: "Подключено", d: "Аккаунт клиники +7 9•• •••-12-34 · вход по номеру и коду (MTProto). Видны все обычные чаты, можно писать первым.", x: <><div className="text-xs bg-slate-50 rounded-lg p-2 mt-2">Сессия зашифрована и хранится на сервере в России. Лимит рассылки: 1 сообщ. / 30 с.</div><div className="mt-2 text-xs border-t pt-2"><b>Альтернатива: бот клиники</b> — @klinika_bot, пациент начинает диалог сам. <a style={{ color: P }}>Подключить токен →</a></div></>, b: "Отключить" },
    { c: "vk", t: "ВКонтакте", s: "Подключено", d: "Сообщество «Клиника Здоровье» · сообщения сообщества через API. Писать можно тем, кто разрешил сообщения.", b: "Настроить" },
    { c: "mx", t: "Макс", s: "Ожидает проверки", d: "Бот для организации на платформе Макс. Заявка отправлена, идёт верификация юрлица (ИНН 77••••••12).", b: "Статус заявки" },
    { c: "wa", t: "WhatsApp", s: "Не подключено", d: "Официально через провайдера WhatsApp Business API (Wazzup, Chat2Desk, Radist). Первое сообщение — только по одобренному шаблону, платно.", b: "Подключить" }];
  return <div className="p-6 h-full overflow-hidden"><div className="text-xs text-slate-400">Настройки › Каналы</div><h1 className="text-2xl font-bold mb-4">Каналы связи</h1>
    <div className="grid grid-cols-2 gap-4">{cards.map(k => <div key={k.c} className="bg-white border rounded-xl p-4 text-sm"><div className="flex items-center gap-3 mb-2"><B ch={k.c} s={36} /><b className="text-base flex-1">{k.t}</b><S s={k.s} /></div><p className="text-slate-600">{k.d}</p>{k.x}
      {k.c == "tg" ? null : k.c == "wa" ? <div className="flex gap-2 mt-3"><input className="flex-1 bg-slate-100 rounded-lg px-3 py-2" placeholder="Провайдер ▾  ·  API-ключ" /></div> : null}
      <button className={`mt-3 rounded-lg px-4 py-2 ${k.s == "Не подключено" ? "text-white" : "border"}`} style={k.s == "Не подключено" ? { background: P } : {}}>{k.b}</button></div>)}</div>
    <div className="mt-4 text-xs text-slate-500">Входящие из всех каналов попадают в «Мультичат». Пациенты объединяются по номеру телефона.</div></div>;
}
export const Side = ({ a }: { a: string }) => <div className="w-[64px] bg-white border-r flex flex-col items-center py-4 gap-5 text-xl">{[["🏥", ""], ["📅", ""], ["💬", "inbox"], ["📣", "mailing"], ["⚙️", "channels"]].map(([i, k]) => <span key={i} className="w-10 h-10 flex items-center justify-center rounded-xl" style={k == a ? { background: "#EDE7FB" } : {}}>{i}</span>)}</div>;
export default function Page() {
  const [v, setV] = useState("inbox");
  useEffect(() => { setV(location.hash.slice(1) || "inbox"); }, []);
  if (v == "ai-composer-m") return <A.ComposerMobile />;
  if (v.startsWith("ai-")) { const M: any = { "ai-digest": A.Digest, "ai-triage": A.Triage, "ai-composer": A.ComposerView, "ai-style": A.Style, "ai-analytics": A.Analytics, "ai-schedule": A.Schedule }; const X = M[v]; return <div className="h-screen flex bg-slate-50 text-slate-800"><Side a={v == "ai-style" ? "channels" : "inbox"} /><div className="flex-1 min-w-0 h-full"><X /></div></div>; }
  if (v.startsWith("a-")) return <MobileAttach tab={v.slice(2)} />;
  if (v == "ed-m") return <Editor />;
  if (v == "d-attach" || v == "d-ed") return <div className="h-screen flex bg-slate-50 text-slate-800 relative"><Side a="inbox" /><div className="flex-1 min-w-0 h-full"><Inbox /></div>
    {v == "d-attach" ? <div className="absolute left-[400px] bottom-[70px] z-20"><Sheet tab="tpl" desk /></div> : <><div className="absolute inset-0 bg-black/40 z-10" /><div className="absolute inset-0 z-20 flex items-center justify-center"><Editor desk /></div></>}</div>;
  if (v.startsWith("m-")) return <div className="h-screen bg-slate-50"><Inbox mobile conv={v == "m-conv"} /></div>;
  return <div className="h-screen flex bg-slate-50 text-slate-800"><Side a={v} /><div className="flex-1 min-w-0 h-full">
    <div className="absolute top-2 right-3 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded z-10">МАКЕТ · демо-данные</div>
    {v == "inbox" ? <Inbox /> : v == "mailing" ? <><div className="px-6 pt-5"><h1 className="text-2xl font-bold">Новая рассылка</h1></div><Mailing /></> : <Channels />}</div></div>;
}
