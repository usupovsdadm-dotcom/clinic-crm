import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Injectable, Module, NotFoundException, Param, Post } from "@nestjs/common";
import { IsObject, IsOptional, IsString } from "class-validator";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit";
import { AuthUser, Public, Roles, User } from "../common/auth";
import { dec, enc } from "../common/crypto";
import { ChannelAdapter, ChannelCtx } from "./adapter";
import { TelegramBotAdapter } from "./adapters/telegram-bot";
import { VkAdapter } from "./adapters/vk";
import { MaxAdapter, SmsAdapter, TelegramUserAdapter, WhatsAppAdapter } from "./adapters/pending";
export const ADAPTERS: Record<string, ChannelAdapter> = { telegram_bot: new TelegramBotAdapter(), vk: new VkAdapter(), max: MaxAdapter, whatsapp: WhatsAppAdapter, telegram_user: TelegramUserAdapter, sms: SmsAdapter };
class ConnectDto { @IsString() type: string; @IsString() secret: string; @IsOptional() @IsObject() config?: Record<string, any> }
@Injectable()
export class ChannelsService {
  constructor(private db: PrismaService) {}
  ctx(ch: { id: string; secretEnc: string | null; config: any }): ChannelCtx { return { secret: ch.secretEnc ? dec(ch.secretEnc) : "", config: ch.config || {}, webhookUrl: `${process.env.PUBLIC_URL}/webhooks/${ch.id}` }; }
  /** Входящее сообщение: находим/создаём диалог, привязываем пациента по телефону */
  async ingest(channelId: string, body: any, headers: Record<string, string>) {
    const ch = await this.db.channel.findUnique({ where: { id: channelId } }); if (!ch) throw new NotFoundException();
    const { messages, reply } = ADAPTERS[ch.type].parse(this.ctx(ch), body, headers);
    for (const m of messages) {
      let patientId: string | undefined;
      if (m.phone) { const phone = "+7" + m.phone.replace(/\D/g, "").slice(-10); const p = await this.db.patient.findUnique({ where: { clinicId_phone: { clinicId: ch.clinicId, phone } } }); if (p) { patientId = p.id; await this.db.patientIdentity.upsert({ where: { channel_externalId_patientId: { channel: ch.type, externalId: m.externalChatId, patientId: p.id } }, update: {}, create: { patientId: p.id, channel: ch.type, externalId: m.externalChatId, username: m.username } }); } }
      const cv = await this.db.conversation.upsert({ where: { channelId_externalChatId: { channelId, externalChatId: m.externalChatId } }, update: { unread: { increment: 1 }, lastMessageAt: new Date(), lastInboundAt: new Date(), ...(patientId ? { patientId } : {}) }, create: { clinicId: ch.clinicId, channelId, externalChatId: m.externalChatId, patientId, unread: 1, lastInboundAt: new Date() } });
      await this.db.message.create({ data: { conversationId: cv.id, direction: "in", text: m.text, attachments: (m.attachments || []) as any, externalId: m.externalMsgId, status: "received" } });
    }
    return reply ?? "ok";
  }
}
@Controller()
export class ChannelsController {
  constructor(private db: PrismaService, private s: ChannelsService, private audit: AuditService) {}
  @Get("channels") @Roles("owner", "admin") list(@User() u: AuthUser) { return this.db.channel.findMany({ where: { clinicId: u.clinicId }, select: { id: true, type: true, title: true, status: true, createdAt: true } }); }
  @Post("channels") @Roles("owner") async connect(@User() u: AuthUser, @Body() d: ConnectDto) {
    const a = ADAPTERS[d.type]; if (!a) throw new BadRequestException("Неизвестный канал");
    const ch = await this.db.channel.create({ data: { clinicId: u.clinicId, type: d.type as any, title: d.type, secretEnc: enc(d.secret), config: d.config || {} } });
    try { const r = await a.connect(this.s.ctx(ch)); await this.db.channel.update({ where: { id: ch.id }, data: { title: r.title, config: { ...(d.config || {}), ...(r.config || {}) }, status: "connected" } }); }
    catch (e: any) { await this.db.channel.update({ where: { id: ch.id }, data: { status: "error: " + e.message } }); }
    await this.audit.log(u, "connect", "channel", ch.id, { type: d.type });
    return this.db.channel.findUnique({ where: { id: ch.id }, select: { id: true, type: true, title: true, status: true } });
  }
  @Public() @Post("webhooks/:id") @HttpCode(200) hook(@Param("id") id: string, @Body() b: any, @Headers() h: Record<string, string>) { return this.s.ingest(id, b, h); }
}
@Module({ providers: [ChannelsService], controllers: [ChannelsController], exports: [ChannelsService] })
export class ChannelsModule {}
