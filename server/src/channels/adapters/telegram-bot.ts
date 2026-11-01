import { ChannelAdapter, ChannelCtx, Inbound } from "../adapter";
const api = async (token: string, m: string, body: object) => {
  const r = await fetch(`https://api.telegram.org/bot${token}/${m}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j: any = await r.json(); if (!j.ok) throw new Error("Telegram: " + j.description); return j.result;
};
/** Telegram Bot API. Пациент должен сам начать диалог (/start). */
export class TelegramBotAdapter implements ChannelAdapter {
  readonly type = "telegram_bot";
  async connect(ctx: ChannelCtx) {
    const me = await api(ctx.secret, "getMe", {});
    const hookSecret = ctx.config.hookSecret || Math.random().toString(36).slice(2) + Date.now().toString(36);
    await api(ctx.secret, "setWebhook", { url: ctx.webhookUrl, secret_token: hookSecret, allowed_updates: ["message"] });
    return { title: "@" + me.username, config: { hookSecret, botId: me.id } };
  }
  parse(ctx: ChannelCtx, b: any, h: Record<string, string>) {
    if (ctx.config.hookSecret && h["x-telegram-bot-api-secret-token"] !== ctx.config.hookSecret) return { messages: [] };
    const m = b.message; if (!m) return { messages: [] };
    const out: Inbound = { externalChatId: String(m.chat.id), externalMsgId: String(m.message_id), text: m.text || m.caption || "", name: [m.from?.first_name, m.from?.last_name].filter(Boolean).join(" "), username: m.from?.username, phone: m.contact?.phone_number };
    if (m.photo) out.attachments = [{ type: "photo", fileId: m.photo[m.photo.length - 1].file_id }];
    if (m.document) out.attachments = [{ type: "file", fileId: m.document.file_id }];
    return { messages: [out] };
  }
  async send(ctx: ChannelCtx, chatId: string, text: string) { const r = await api(ctx.secret, "sendMessage", { chat_id: chatId, text }); return { externalId: String(r.message_id) }; }
}
