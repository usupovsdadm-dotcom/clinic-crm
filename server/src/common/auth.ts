import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException, ForbiddenException, createParamDecorator } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
export type Role = "owner" | "admin" | "doctor";
export interface AuthUser { sub: string; clinicId: string; role: Role; doctorId?: string | null }
export const Roles = (...r: Role[]) => SetMetadata("roles", r);
export const Public = () => SetMetadata("public", true);
export const User = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user);
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private refl: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const h = [ctx.getHandler(), ctx.getClass()];
    if (this.refl.getAllAndOverride<boolean>("public", h)) return true;
    const req = ctx.switchToHttp().getRequest();
    const tok = (req.headers.authorization || "").replace(/^Bearer /, "");
    try { req.user = this.jwt.verify(tok); } catch { throw new UnauthorizedException(); }
    const roles = this.refl.getAllAndOverride<Role[]>("roles", h);
    if (roles && !roles.includes(req.user.role)) throw new ForbiddenException("Недостаточно прав");
    return true;
  }
}
/** Маскирование телефона для врачей (как в демо) */
export const maskPhone = (p: string, role: Role) => role === "doctor" ? p.replace(/^(\+7)(\d)\d{2}(\d{3})\d{2}(\d{2})$/, "$1 ($2••) •••-••-$4") : p;
