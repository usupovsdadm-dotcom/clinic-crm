import { ChannelAdapter, ChannelCtx, NotConfigured } from "../adapter";
/** Заготовки: подключаются после получения доступов. */
class Pending implements ChannelAdapter {
  constructor(readonly type: string, private note: string) {}
  async connect(_: ChannelCtx): Promise<{ title: string }> { throw new NotConfigured(this.type + " — " + this.note); }
  parse() { return { messages: [] }; }
  async send(): Promise<{ externalId?: string }> { throw new NotConfigured(this.type); }
}
export const MaxAdapter = new Pending("max", "нужен бот организации на платформе Макс (верификация юрлица)");
export const WhatsAppAdapter = new Pending("whatsapp", "нужен аккаунт BSP (Wazzup/Chat2Desk/Radist) и одобренные шаблоны");
export const TelegramUserAdapter = new Pending("telegram_user", "MTProto: нужны api_id/api_hash с my.telegram.org и отдельный воркер с GramJS");
export const SmsAdapter = new Pending("sms", "нужен SMS-провайдер (SMS.ru/SMSC) и согласованное имя отправителя");
