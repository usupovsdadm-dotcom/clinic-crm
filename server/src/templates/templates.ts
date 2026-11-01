import { Body, Controller, Delete, Get, Module, Param, Post, Put } from "@nestjs/common";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit";
import { AuthUser, Roles, User } from "../common/auth";
class TplDto { @IsString() name: string; @IsString() category: string; @IsString() @MaxLength(4096) body: string; @IsOptional() @IsBoolean() favorite?: boolean }
@Controller("templates") @Roles("owner", "admin")
export class TemplatesController {
  constructor(private db: PrismaService, private audit: AuditService) {}
  @Get() list(@User() u: AuthUser) { return this.db.template.findMany({ where: { clinicId: u.clinicId }, orderBy: [{ favorite: "desc" }, { name: "asc" }] }); }
  @Post() async create(@User() u: AuthUser, @Body() d: TplDto) { const t = await this.db.template.create({ data: { ...d, clinicId: u.clinicId } }); await this.audit.log(u, "create", "template", t.id); return t; }
  @Put(":id") async update(@User() u: AuthUser, @Param("id") id: string, @Body() d: TplDto) { await this.db.template.updateMany({ where: { id, clinicId: u.clinicId }, data: d }); return { ok: true }; }
  @Post(":id/duplicate") async dup(@User() u: AuthUser, @Param("id") id: string) { const t = await this.db.template.findFirstOrThrow({ where: { id, clinicId: u.clinicId } }); return this.db.template.create({ data: { clinicId: u.clinicId, name: t.name + " (копия)", category: t.category, body: t.body, attachments: t.attachments as any } }); }
  @Delete(":id") async del(@User() u: AuthUser, @Param("id") id: string) { await this.db.template.deleteMany({ where: { id, clinicId: u.clinicId } }); await this.audit.log(u, "delete", "template", id); return { ok: true }; }
}
@Module({ controllers: [TemplatesController] })
export class TemplatesModule {}
