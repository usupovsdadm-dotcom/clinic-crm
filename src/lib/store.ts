"use client";
import { useEffect, useState, useCallback } from "react";
export type Role = "admin" | "doctor" | "owner";
export type Doctor = { id: string; last: string; first: string; mid: string; spec: string; cab: string; price: number };
export type Cabinet = { id: string; name: string };
export type Patient = { id: string; last: string; first: string; mid: string; phone: string; birth: string; tags: string[]; source: string };
export type Appt = { id: string; pid: string; did: string; cab: string; date: string; start: number; dur: number; service: string; status: "new" | "confirmed" | "paid" | "noshow"; price: number; online?: boolean };
export type Feed = { id: string; pid: string; at: string; author: string; kind: "note" | "protocol" | "file" | "lab"; text: string; file?: { name: string; data: string; size: number } };
export type Task = { id: string; pid: string; text: string; due: string; done: boolean };
export type DB = { doctors: Doctor[]; cabinets: Cabinet[]; patients: Patient[]; appts: Appt[]; feed: Feed[]; tasks: Task[] };

export const fio = (p: { last: string; first: string; mid: string }) => `${p.last} ${p.first} ${p.mid ? p.mid[0] + "." : ""}`.trim();
export const fioFull = (p: { last: string; first: string; mid: string }) => `${p.last} ${p.first} ${p.mid}`.trim();
export const short = (p: { last: string; first: string; mid: string }) => `${p.last} ${p.first[0]}.${p.mid ? p.mid[0] + "." : ""}`;
export const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (s: string, n: number) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return ymd(d); };
export const maskPhone = (p: string) => p.replace(/(\+7 \d{3}) \d{3}-(\d{2})-(\d{2})/, "$1 ***-**-$3");
export const uid = () => Math.random().toString(36).slice(2, 10);
export const DAY_START = 9 * 60, DAY_END = 20 * 60, STEP = 30;

const L = ["Петрова","Смирнов","Новикова","Новикова","Кузьмина","Васильев","Морозова","Соколова","Фёдоров","Волкова","Лебедев","Козлова","Егоров","Павлова","Семёнов","Голубева","Виноградов","Богданова","Воробьёв","Тихонова","Белов","Медведева","Ершова","Никитин","Макарова"];
const F = ["Анна","Алексей","Ирина","Ирина","Дарья","Игорь","Ольга","Елена","Павел","Мария","Сергей","Татьяна","Денис","Юлия","Артём","Наталья","Максим","Ксения","Роман","Вера","Глеб","Алина","Софья","Кирилл","Полина"];
const M = ["Сергеевна","Николаевич","Андреевна","Константиновна","Олеговна","Петрович","Дмитриевна","Викторовна","Степанович","Игоревна","Александрович","Юрьевна","Павлович","Романовна","Ильич","Михайловна","Евгеньевич","Алексеевна","Антонович","Борисовна","Тимурович","Вадимовна","Львовна","Георгиевич","Артёмовна"];
const SERV = [["Первичный приём",2500,30],["Повторный приём",1800,30],["Чекап",6500,60],["УЗИ",2200,30],["Процедура",1500,30]] as const;

function seed(): DB {
  const doctors: Doctor[] = [
    { id: "d1", last: "Иванова", first: "Полина", mid: "Сергеевна", spec: "Терапевт", cab: "c1", price: 2500 },
    { id: "d2", last: "Кузнецов", first: "Андрей", mid: "Викторович", spec: "ЛОР", cab: "c2", price: 2800 },
    { id: "d3", last: "Смирнова", first: "Марина", mid: "Олеговна", spec: "Гинеколог", cab: "c3", price: 3000 },
    { id: "d4", last: "Орлов", first: "Дмитрий", mid: "Ильич", spec: "Врач УЗИ", cab: "c4", price: 2200 },
  ];
  const cabinets = [{ id: "c1", name: "Каб. 101" }, { id: "c2", name: "Каб. 102" }, { id: "c3", name: "Каб. 201" }, { id: "c4", name: "УЗИ-кабинет" }];
  const src = ["Сайт", "Яндекс Карты", "ПроДокторов", "Повторный", "Привёл врач"];
  const patients: Patient[] = L.map((l, i) => ({ id: "p" + i, last: l, first: F[i], mid: M[i], phone: `+7 9${10 + (i * 7) % 89} ${100 + i * 31 % 900}-${String(10 + i * 3 % 90)}-${String(20 + i * 7 % 80)}`, birth: `${1960 + (i * 3) % 40}-0${1 + i % 9}-1${i % 9}`, tags: i % 5 === 0 ? ["ДМС"] : i % 7 === 0 ? ["Аллергия: пенициллин"] : [], source: src[i % 5] }));
  const appts: Appt[] = []; let r = 7;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const today = ymd(new Date());
  for (let dd = -70; dd <= 7; dd++) {
    const date = addDays(today, dd); const wd = new Date(date + "T12:00").getDay(); if (wd === 0) continue;
    for (const d of doctors) {
      let t = DAY_START + (rnd() < .5 ? 0 : 30);
      while (t < DAY_END - 60) {
        if (rnd() < (dd < 0 ? .7 : .45)) {
          const s = SERV[d.id === "d4" ? 3 : Math.floor(rnd() * 3)];
          const st = dd < 0 ? (rnd() < .05 ? "noshow" : "paid") : dd === 0 && t < new Date().getHours() * 60 ? "paid" : rnd() < .6 ? "confirmed" : "new";
          appts.push({ id: uid(), pid: "p" + Math.floor(rnd() * Math.min(patients.length, 8 + Math.floor((dd + 70) / 4.5))), did: d.id, cab: d.cab, date, start: t, dur: s[2], service: s[0], status: st, price: s[1], online: rnd() < .34 });
          t += s[2];
        } else t += 60;
      }
    }
  }
  const feed: Feed[] = [
    { id: uid(), pid: "p0", at: addDays(today, -3) + " 11:20", author: "Иванова П.С.", kind: "protocol", text: "Жалобы на слабость, быструю утомляемость в течение 2 месяцев. Объективно: кожные покровы бледные, ЧСС 84. Ферритин 9 нг/мл (↓). Диагноз: латентный дефицит железа.\nНазначено: железо 100 мг/сут 2 мес., контроль ферритина и ОАК через 6 недель. Рекомендации по питанию выданы." },
    { id: uid(), pid: "p0", at: addDays(today, -6) + " 09:05", author: "Лаборатория", kind: "lab", text: "Результаты: ОАК, ферритин, ТТГ — получены автоматически (демо)." },
    { id: uid(), pid: "p0", at: addDays(today, -10) + " 18:40", author: "Админ", kind: "note", text: "Пациентка просит записывать на утро, до 11:00. Предпочитает связь в Telegram." },
  ];
  const tasks: Task[] = [
    { id: uid(), pid: "p0", text: "Позвонить по результатам анализов", due: addDays(today, 2), done: false },
    { id: uid(), pid: "p0", text: "Контроль ферритина", due: addDays(today, 42), done: false },
    { id: uid(), pid: "p0", text: "Отправить памятку по питанию", due: addDays(today, -2), done: true },
  ];
  return { doctors, cabinets, patients, appts, feed, tasks };
}

const KEY = "clinic-crm-db-v2";
let mem: DB | null = null; const subs = new Set<() => void>();
function load(): DB { if (mem) return mem; try { const s = localStorage.getItem(KEY); mem = s ? JSON.parse(s) : seed(); } catch { mem = seed(); } return mem!; }
export function save(fn: (db: DB) => void) { const db = structuredClone(load()); fn(db); mem = db; try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { alert("Хранилище браузера переполнено — файл слишком большой для прототипа"); } subs.forEach(f => f()); }
export function resetDB() { localStorage.removeItem(KEY); mem = null; mem = seed(); localStorage.setItem(KEY, JSON.stringify(mem)); subs.forEach(f => f()); }
export function useDB(): DB | null {
  const [, set] = useState(0); const [ready, setReady] = useState(false);
  useEffect(() => { load(); setReady(true); const f = () => set(x => x + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  return ready ? load() : null;
}
/** returns conflict reason or null */
export function conflict(db: DB, a: { id?: string; did: string; cab: string; date: string; start: number; dur: number }): string | null {
  for (const b of db.appts) {
    if (b.id === a.id || b.date !== a.date || b.status === "noshow") continue;
    if (a.start < b.start + b.dur && b.start < a.start + a.dur) {
      if (b.did === a.did) return "У врача уже есть запись на это время";
      if (b.cab === a.cab) { const d = db.doctors.find(x => x.id === b.did)!; return `${db.cabinets.find(c => c.id === a.cab)?.name} занят: ${short(d)} ${hm(b.start)}–${hm(b.start + b.dur)}`; }
    }
  }
  if (new Date(a.date + "T12:00").getDay() === 0) return "Воскресенье — выходной";
  if (a.start < DAY_START || a.start + a.dur > DAY_END) return "Вне рабочего времени";
  return null;
}
export function useLocal<T>(k: string, init: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(init);
  useEffect(() => { const s = localStorage.getItem(k); if (s) setV(JSON.parse(s)); }, [k]);
  return [v, useCallback((x: T) => { setV(x); localStorage.setItem(k, JSON.stringify(x)); }, [k])];
}

export const workday = () => { const d = new Date(); if (d.getDay() === 0) d.setDate(d.getDate() + 1); return ymd(d); };
