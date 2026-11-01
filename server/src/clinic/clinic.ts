import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Module, NotFoundException, Param, Patch, Post, Put } from "@nestjs/common";
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, Matches, Max, Min, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit";
import { AuthUser, Roles, User } from "../common/auth";
import { normPhone } from "../patients/patients";

class DoctorDto { @IsString() @MinLength(2) name: string; @IsString() @MinLength(2) specialty: string; @IsOptional() @IsString() room?: string }
class DayDto { @IsInt() @Min(0) @Max(6) day: number; @Matches(/^\d{2}:\d{2}$/) from: string; @Matches(/^\d{2}:\d{2}$/) to: string }
class ScheduleDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => DayDto) days: DayDto[];
  @IsInt() @Min(10) @Max(240) slotMinutes: number;
}
class ImportRow { @IsString() @MinLength(2) fullName: string; @IsString() phone: string; @IsOptional() @IsString() birthDate?: string; @IsOptional() @IsString() notes?: string }
class ImportDto { @IsArray() @ArrayMaxSize(5000) @ValidateNested({ each: true }) @Type(() => ImportRow) rows: ImportRow[] }

@Controller()
export class ClinicController {
  constructor(private db: PrismaService, private audit: AuditService) {}
  @Get("clinic") async clinic(@User() u: AuthUser) {
    return this.db.clinic.findUnique({ where: { id: u.clinicId }, select: { id: true, name: true, city: true, timezone: true, plan: true, settings: true } });
  }
  @Roles("owner", "admin") @Put("clinic/schedule") async schedule(@User() u: AuthUser, @Body() d: ScheduleDto) {
    for (const x of d.days) if (x.from >= x.to) throw new BadRequestException("Время начала должно быть раньше конца");
    const c = await this.db.clinic.findUnique({ where: { id: u.clinicId } });
    const settings = { ...((c?.settings as any) || {}), schedule: { days: d.days, slotMinutes: d.slotMinutes } };
    await this.db.clinic.update({ where: { id: u.clinicId }, data: { settings } });
    await this.audit.log(u, "update", "schedule", u.clinicId); return settings.schedule;
  }
  @Get("onboarding") async onboarding(@User() u: AuthUser) {
    const [doctors, patients, channels, c] = await Promise.all([
      this.db.doctor.count({ where: { clinicId: u.clinicId } }), this.db.patient.count({ where: { clinicId: u.clinicId } }),
      this.db.channel.count({ where: { clinicId: u.clinicId, status: "connected" } }), this.db.clinic.findUnique({ where: { id: u.clinicId }, select: { settings: true } })]);
    const schedule = !!(c?.settings as any)?.schedule?.days?.length;
    return { doctors: doctors > 0, schedule, channels: channels > 0, patients: patients > 0, counts: { doctors, patients, channels } };
  }
  @Roles("owner", "admin") @Post("doctors") async addDoctor(@User() u: AuthUser, @Body() d: DoctorDto) {
    const r = await this.db.doctor.create({ data: { clinicId: u.clinicId, name: d.name.trim(), specialty: d.specialty.trim(), room: d.room?.trim() || null } });
    await this.audit.log(u, "create", "doctor", r.id); return r;
  }
  @Roles("owner", "admin") @Patch("doctors/:id") async editDoctor(@User() u: AuthUser, @Param("id") id: string, @Body() d: DoctorDto) {
    const r = await this.db.doctor.updateMany({ where: { id, clinicId: u.clinicId }, data: { name: d.name.trim(), specialty: d.specialty.trim(), room: d.room?.trim() || null } });
    if (!r.count) throw new NotFoundException(); await this.audit.log(u, "update", "doctor", id); return { ok: true };
  }
  @Roles("owner", "admin") @Delete("doctors/:id") async delDoctor(@User() u: AuthUser, @Param("id") id: string) {
    const doc = await this.db.doctor.findFirst({ where: { id, clinicId: u.clinicId }, include: { _count: { select: { appointments: true } }, user: true } });
    if (!doc) throw new NotFoundException();
    if (doc._count.appointments || doc.user) throw new ConflictException("У врача есть записи или аккаунт — удалить нельзя");
    await this.db.doctor.delete({ where: { id } }); await this.audit.log(u, "delete", "doctor", id); return { ok: true };
  }
  @Roles("owner", "admin") @Post("patients/import") async importPatients(@User() u: AuthUser, @Body() d: ImportDto) {
    const seen = new Set<string>(); const data: any[] = []; const errors: string[] = [];
    d.rows.forEach((r, i) => {
      const digits = r.phone.replace(/\D/g, "");
      if (digits.length < 10) { errors.push(`Строка ${i + 1}: неверный телефон`); return; }
      const phone = normPhone(r.phone); if (seen.has(phone)) return; seen.add(phone);
      const bd = r.birthDate ? new Date(r.birthDate) : undefined;
      data.push({ clinicId: u.clinicId, fullName: r.fullName.trim(), phone, notes: r.notes || undefined, birthDate: bd && !isNaN(+bd) ? bd : undefined });
    });
    const res = await this.db.patient.createMany({ data, skipDuplicates: true });
    await this.audit.log(u, "import", "patient", u.clinicId, { created: res.count });
    return { created: res.count, skipped: data.length - res.count, errors };
  }
}
@Module({ controllers: [ClinicController] })
export class ClinicModule {}
