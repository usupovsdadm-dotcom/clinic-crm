import { ChannelAdapter, ChannelCtx } from "../adapter";
const V = "5.199";
const api = async (token: string, m: string, p: Record<string, any>) => {
  const r = await fetch(`https://api.vk.com/method/${m}`, { method: "POST", body: new URLSearchParams({ ...p, access_token: token, v: V }) });
  const j: any = await r.json(); if (j.error) throw new Error("VK: " + j.error.error_msg); return j.response;
};
/** Сообщения сообщества ВКонтакте через Callback API. config: { groupId, confirmation, secret } */
export class VkAdapter implements ChannelAdapter {
  readonly type = "vk";
  async connect(ctx: ChannelCtx) {
    const [g] = await api(ctx.secret, "groups.getById", {}).then((r: any) => r.groups || r);
    const confirmation = (await api(ctx.secret, "groups.getCallbackConfirmationCode", { group_id: g.id })).code;
    const secret = ctx.config.secret || Math.random().toString(36).slice(2);
    const srv = await api(ctx.secret, "groups.addCallbackServer", { group_id: g.id, url: ctx.webhookUrl, title: "Clinic CRM", secret_key: secret });
    await api(ctx.secret, "groups.setCallbackSettings", { group_id: g.id, server_id: srv.server_id, api_version: V, message_new: 1 });
    return { title: g.name, config: { groupId: g.id, confirmation, secret } };
  }
  parse(ctx: ChannelCtx, b: any) {
    if (b.type === "confirmation") return { messages: [], reply: ctx.config.confirmation };
    if (ctx.config.secret && b.secret !== ctx.config.secret) return { messages: [], reply: "ok" };
    if (b.type !== "message_new") return { messages: [], reply: "ok" };
    const m = b.object.message;
    return { messages: [{ externalChatId: String(m.peer_id), externalMsgId: String(m.id), text: m.text || "", attachments: (m.attachments || []).map((a: any) => ({ type: a.type })) }], reply: "ok" };
  }
  async send(ctx: ChannelCtx, peerId: string, text: string) { const id = await api(ctx.secret, "messages.send", { peer_id: peerId, message: text, random_id: Date.now() }); return { externalId: String(id) }; }
}
