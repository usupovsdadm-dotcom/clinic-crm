import { Body, ConflictException, Controller, Get, Module, Param, Patch, Post, Query } from "@nestjs/common";
import { IsIn, IsISO8601, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit";
import { AuthUser, Roles, User } from "../common/auth";
class ApptDto { @IsString() doctorId: string; @IsString() patientId: string; @IsISO8601() startsAt: string; @IsInt() @Min(10) @Max(240) minutes: number; @IsOptional() @IsString() service?: string }
class StatusDto { @IsIn(["booked", "confirmed", "done", "no_show", "cancelled"]) status: any }
@Controller()
export class AppointmentsController {
  constructor(private db: PrismaService, private audit: AuditService) {}
  @Get("doctors") doctors(@User() u: AuthUser) { return this.db.doctor.findMany({ where: { clinicId: u.clinicId } }); }
  @Get("appointments") list(@User() u: AuthUser, @Query("from") from: string, @Query("to") to: string, @Query("doctorId") doctorId?: string) {
    return this.db.appointment.findMany({ where: { clinicId: u.clinicId, startsAt: { gte: new Date(from), lt: new Date(to) }, doctorId: u.role === "doctor" ? u.doctorId! : doctorId }, include: { patient: { select: { id: true, fullName: true } }, doctor: true }, orderBy: { startsAt: "asc" } });
  }
  /** Свободные окна врача на день (для ИИ-подсказок и «отправить слоты в чат») */
  @Get("slots") async slots(@User() u: AuthUser, @Query("doctorId") doctorId: string, @Query("date") date: string, @Query("step") step = "30") {
    const d0 = new Date(date + "T09:00:00+03:00"), d1 = new Date(date + "T20:00:00+03:00");
    const busy = await this.db.appointment.findMany({ where: { clinicId: u.clinicId, doctorId, status: { not: "cancelled" }, startsAt: { lt: d1 }, endsAt: { gt: d0 } } });
    const out: string[] = [];
    for (let t = d0.getTime(); t < d1.getTime(); t += +step * 60000) { const e = t + +step * 60000; if (!busy.some(b => b.startsAt.getTime() < e && b.endsAt.getTime() > t)) out.push(new Date(t).toISOString()); }
    return out;
  }
  @Roles("owner", "admin") @Post("appointments") async create(@User() u: AuthUser, @Body() d: ApptDto) {
    const s = new Date(d.startsAt), e = new Date(s.getTime() + d.minutes * 60000);
    const clash = await this.db.appointment.findFirst({ where: { doctorId: d.doctorId, status: { not: "cancelled" }, startsAt: { lt: e }, endsAt: { gt: s } } });
    if (clash) throw new ConflictException("Время уже занято");
    const a = await this.db.appointment.create({ data: { clinicId: u.clinicId, doctorId: d.doctorId, patientId: d.patientId, startsAt: s, endsAt: e, service: d.service } });
    await this.audit.log(u, "create", "appointment", a.id); return a;
  }
  @Patch("appointments/:id/status") async status(@User() u: AuthUser, @Param("id") id: string, @Body() d: StatusDto) {
    const where: any = { id, clinicId: u.clinicId }; if (u.role === "doctor") where.doctorId = u.doctorId;
    await this.db.appointment.updateMany({ where, data: { status: d.status } });
    await this.audit.log(u, "status", "appointment", id, d); return { ok: true };
  }
}
@Module({ controllers: [AppointmentsController] })
export class AppointmentsModule {}
