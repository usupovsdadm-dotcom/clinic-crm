/** Единый интерфейс канала. Каждый мессенджер реализует его. */
export interface Inbound { externalChatId: string; externalMsgId?: string; text: string; name?: string; username?: string; phone?: string; attachments?: { type: string; url?: string; fileId?: string }[] }
export interface ChannelCtx { secret: string; config: Record<string, any>; webhookUrl: string }
export interface ChannelAdapter {
  readonly type: string;
  /** Проверка токена и регистрация вебхука */
  connect(ctx: ChannelCtx): Promise<{ title: string; config?: Record<string, any> }>;
  /** Разбор входящего вебхука. Может вернуть строку-ответ (например, подтверждение VK). */
  parse(ctx: ChannelCtx, body: any, headers: Record<string, string>): { messages: Inbound[]; reply?: string };
  send(ctx: ChannelCtx, externalChatId: string, text: string): Promise<{ externalId?: string }>;
}
export class NotConfigured extends Error { constructor(t: string) { super(`Канал ${t}: требуется подключение (нет доступов)`); } }
