import { Body, Controller, Get, Injectable, Module, Post, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { Equals, IsBoolean, IsEmail, IsString, Matches, MinLength } from "class-validator";
import { ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser, Public, Roles, User } from "../common/auth";
class LoginDto { @IsEmail() email: string; @IsString() @MinLength(6) password: string }
class InviteDto { @IsEmail() email: string; @IsString() name: string; @IsString() role: "admin" | "doctor" | "owner"; @IsString() @MinLength(8) password: string }
class RegisterDto { @IsString() clinicName: string; @IsEmail() email: string; @IsString() name: string; @IsString() @MinLength(8) password: string }
class RegisterClinicDto { @IsString() @MinLength(2) clinicName: string; @IsString() city: string; @IsString() ownerName: string; @IsString() @Matches(/^\+?[\d\s()\-]{10,20}$/, { message: "Неверный телефон" }) phone: string; @IsEmail() email: string; @IsString() @MinLength(8) password: string; @IsBoolean() @Equals(true, { message: "Нужно согласие с офертой и политикой ПДн" }) consent: boolean }
@Injectable()
export class AuthService {
  constructor(private db: PrismaService, private jwt: JwtService) {}
  token(u: { id: string; clinicId: string; role: string; doctorId: string | null }) { return this.jwt.sign({ sub: u.id, clinicId: u.clinicId, role: u.role, doctorId: u.doctorId }); }
  async login(d: LoginDto) {
    const u = await this.db.user.findUnique({ where: { email: d.email.toLowerCase() } });
    if (!u || !(await bcrypt.compare(d.password, u.password))) throw new UnauthorizedException("Неверный email или пароль");
    return { token: this.token(u), user: { id: u.id, name: u.name, role: u.role, clinicId: u.clinicId } };
  }
}
@Controller("auth")
export class AuthController {
  constructor(private s: AuthService, private db: PrismaService) {}
  @Public() @Post("login") login(@Body() d: LoginDto) { return this.s.login(d); }
  /** Самостоятельная регистрация клиники (тенант + владелец) */
  @Public() @Post("register") async register(@Body() d: RegisterDto) {
    const slug = d.clinicName.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").slice(0, 40) + "-" + Date.now().toString(36);
    const c = await this.db.clinic.create({ data: { name: d.clinicName, slug, users: { create: { email: d.email.toLowerCase(), name: d.name, role: "owner", password: await bcrypt.hash(d.password, 10) } } }, include: { users: true } });
    return { token: this.s.token(c.users[0]), clinicId: c.id };
  }
  /** Регистрация клиники с фронта: клиника-тенант + владелец, сразу выдаёт сессию */
  @Public() @Post("register-clinic") async registerClinic(@Body() d: RegisterClinicDto) {
    const email = d.email.toLowerCase();
    if (await this.db.user.findUnique({ where: { email } })) throw new ConflictException("Этот email уже зарегистрирован — войдите");
    const slug = "c-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const c = await this.db.clinic.create({ data: { name: d.clinicName, city: d.city, slug, users: { create: { email, name: d.ownerName, phone: "+7" + d.phone.replace(/\D/g, "").slice(-10), role: "owner", termsAcceptedAt: new Date(), password: await bcrypt.hash(d.password, 10) } } }, include: { users: true } });
    await this.db.auditLog.create({ data: { clinicId: c.id, userId: c.users[0].id, action: "register", entity: "clinic", entityId: c.id } });
    return { token: this.s.token(c.users[0]), clinicId: c.id, user: { name: d.ownerName, role: "owner" } };
  }
  @Get("me") me(@User() u: AuthUser) { return this.db.user.findUnique({ where: { id: u.sub }, select: { id: true, name: true, email: true, role: true, clinic: { select: { id: true, name: true } } } }); }
  @Roles("owner") @Post("invite") async invite(@User() u: AuthUser, @Body() d: InviteDto) {
    const x = await this.db.user.create({ data: { clinicId: u.clinicId, email: d.email.toLowerCase(), name: d.name, role: d.role, password: await bcrypt.hash(d.password, 10) } });
    return { id: x.id };
  }
}
@Module({ providers: [AuthService], controllers: [AuthController] })
export class AuthModule {}
