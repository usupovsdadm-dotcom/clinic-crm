import { Body, Controller, Get, Module, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { IsBoolean, IsOptional, IsString, Matches } from "class-validator";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit";
import { AuthUser, maskPhone, Roles, User } from "../common/auth";
export const normPhone = (p: string) => { const d = p.replace(/\D/g, ""); return "+7" + d.slice(-10); };
class PatientDto { @IsString() fullName: string; @IsString() @Matches(/\d{10}/) phone: string; @IsOptional() @IsString() birthDate?: string; @IsOptional() @IsString() notes?: string }
class ConsentDto { @IsBoolean() consentMailing: boolean }
@Controller("patients")
export class PatientsController {
  constructor(private db: PrismaService, private audit: AuditService) {}
  @Get() async list(@User() u: AuthUser, @Query("q") q?: string) {
    const where: any = { clinicId: u.clinicId };
    if (q) where.OR = [{ fullName: { contains: q, mode: "insensitive" } }, { phone: { contains: q.replace(/\D/g, "") } }];
    if (u.role === "doctor") where.appointments = { some: { doctorId: u.doctorId } };
    const r = await this.db.patient.findMany({ where, orderBy: { fullName: "asc" }, take: 200 });
    return r.map(p => ({ ...p, phone: maskPhone(p.phone, u.role) }));
  }
  @Get(":id") async one(@User() u: AuthUser, @Param("id") id: string) {
    const p = await this.db.patient.findFirst({ where: { id, clinicId: u.clinicId }, include: { identities: true, appointments: { include: { doctor: true }, orderBy: { startsAt: "desc" } } } });
    if (!p) throw new NotFoundException();
    await this.audit.log(u, "view", "patient", id);
    return { ...p, phone: maskPhone(p.phone, u.role) };
  }
  @Roles("owner", "admin") @Post() async create(@User() u: AuthUser, @Body() d: PatientDto) {
    const p = await this.db.patient.create({ data: { clinicId: u.clinicId, fullName: d.fullName, phone: normPhone(d.phone), notes: d.notes, birthDate: d.birthDate ? new Date(d.birthDate) : undefined } });
    await this.audit.log(u, "create", "patient", p.id); return p;
  }
  @Roles("owner", "admin") @Patch(":id/consent") async consent(@User() u: AuthUser, @Param("id") id: string, @Body() d: ConsentDto) {
    await this.db.patient.updateMany({ where: { id, clinicId: u.clinicId }, data: { consentMailing: d.consentMailing, consentAt: d.consentMailing ? new Date() : null } });
    await this.audit.log(u, "consent", "patient", id, d); return { ok: true };
  }
}
@Module({ controllers: [PatientsController] })
export class PatientsModule {}
