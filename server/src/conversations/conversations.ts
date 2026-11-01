import { Body, Controller, Get, Module, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit";
import { AuthUser, Roles, User } from "../common/auth";
import { ADAPTERS, ChannelsModule, ChannelsService } from "../channels/channels";
class SendDto { @IsString() @MaxLength(4096) text: string }
class AssignDto { @IsOptional() @IsString() assigneeId?: string }
@Controller("conversations") @Roles("owner", "admin")
export class ConversationsController {
  constructor(private db: PrismaService, private ch: ChannelsService, private audit: AuditService) {}
  @Get() list(@User() u: AuthUser, @Query("filter") f?: string, @Query("channel") channel?: string) {
    const where: any = { clinicId: u.clinicId };
    if (f === "unread") where.unread = { gt: 0 };
    if (f === "mine") where.assigneeId = u.sub;
    if (f === "late") where.AND = [{ unread: { gt: 0 } }, { lastInboundAt: { lt: new Date(Date.now() - 2 * 3600e3) } }];
    if (channel) where.channel = { type: channel };
    return this.db.conversation.findMany({ where, orderBy: { lastMessageAt: "desc" }, take: 100, include: { channel: { select: { type: true, title: true } }, patient: { select: { id: true, fullName: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } } });
  }
  /** Утренняя сводка: без ответа / ждут >2ч */
  @Get("digest") async digest(@User() u: AuthUser) {
    const base = { clinicId: u.clinicId, unread: { gt: 0 } };
    const [noReply, late] = await Promise.all([this.db.conversation.count({ where: base }), this.db.conversation.count({ where: { ...base, lastInboundAt: { lt: new Date(Date.now() - 2 * 3600e3) } } })]);
    return { noReply, late };
  }
  @Get(":id/messages") async messages(@User() u: AuthUser, @Param("id") id: string) {
    const cv = await this.db.conversation.findFirst({ where: { id, clinicId: u.clinicId } }); if (!cv) throw new NotFoundException();
    await this.db.conversation.update({ where: { id }, data: { unread: 0 } });
    return this.db.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: "asc" }, take: 500 });
  }
  @Post(":id/send") async send(@User() u: AuthUser, @Param("id") id: string, @Body() d: SendDto) {
    const cv = await this.db.conversation.findFirst({ where: { id, clinicId: u.clinicId }, include: { channel: true } }); if (!cv) throw new NotFoundException();
    const msg = await this.db.message.create({ data: { conversationId: id, direction: "out", text: d.text, authorId: u.sub } });
    let status: any = "sent", externalId: string | undefined;
    if (cv.channel.status === "demo") status = "delivered";
    else try { externalId = (await ADAPTERS[cv.channel.type].send(this.ch.ctx(cv.channel), cv.externalChatId, d.text)).externalId; } catch { status = "failed"; }
    await this.db.conversation.update({ where: { id }, data: { lastMessageAt: new Date(), unread: 0 } });
    await this.audit.log(u, "send", "message", msg.id, { conversationId: id });
    return this.db.message.update({ where: { id: msg.id }, data: { status, externalId } });
  }
  @Post(":id/assign") async assign(@User() u: AuthUser, @Param("id") id: string, @Body() d: AssignDto) { await this.db.conversation.updateMany({ where: { id, clinicId: u.clinicId }, data: { assigneeId: d.assigneeId ?? u.sub } }); return { ok: true }; }
}
@Module({ imports: [ChannelsModule], controllers: [ConversationsController] })
export class ConversationsModule {}
