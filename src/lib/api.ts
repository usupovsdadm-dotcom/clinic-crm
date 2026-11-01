/** Если задан NEXT_PUBLIC_API_URL — работаем с реальным бэкендом, иначе демо-режим (localStorage). */
export const API = process.env.NEXT_PUBLIC_API_URL || "";
export const isLive = () => !!API && typeof window !== "undefined" && !!localStorage.getItem("crm-token");
export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(API + "/api" + path, { ...init, headers: { "content-type": "application/json", Authorization: "Bearer " + (localStorage.getItem("crm-token") || ""), ...(init.headers || {}) } });
  if (r.status === 401) { localStorage.removeItem("crm-token"); throw new Error("Требуется вход"); }
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || r.statusText);
  return r.json();
}
export async function login(email: string, password: string) { const r = await api<{ token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); localStorage.setItem("crm-token", r.token); return r; }
const CHMAP: Record<string, string> = { telegram_bot: "tg", telegram_user: "tg", vk: "vk", max: "mx", whatsapp: "wa", sms: "vk" };
/** Диалоги из API в формате, который рисует Мультичат */
export async function loadConversations() {
  const cs = await api<any[]>("/conversations");
  return Promise.all(cs.map(async (c, i) => { const ms = await api<any[]>(`/conversations/${c.id}/messages`); const name = c.patient?.fullName || "Без имени";
    return { id: i + 1, apiId: c.id, n: name, first: name.split(" ")[1] || name.split(" ")[0], ch: CHMAP[c.channel.type] || "tg", u: c.unread, doc: "", date: "", time: "", sug: "", m: ms.map(m => ({ me: m.direction === "out", ch: CHMAP[c.channel.type] || "tg", x: m.text, t: new Date(m.createdAt).toTimeString().slice(0, 5), s: m.status })) }; }));
}
export const sendMessage = (apiId: string, text: string) => api(`/conversations/${apiId}/send`, { method: "POST", body: JSON.stringify({ text }) });
