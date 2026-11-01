import { Controller, Get, Global, Injectable, Module, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser, Roles, User } from "../common/auth";
@Injectable()
export class AuditService {
  constructor(private db: PrismaService) {}
  log(u: AuthUser, action: string, entity: string, entityId?: string, meta: object = {}) {
    return this.db.auditLog.create({ data: { clinicId: u.clinicId, userId: u.sub, action, entity, entityId, meta } });
  }
}
@Controller("audit")
export class AuditController {
  constructor(private db: PrismaService) {}
  @Get() @Roles("owner") list(@User() u: AuthUser, @Query("take") take = "100") {
    return this.db.auditLog.findMany({ where: { clinicId: u.clinicId }, orderBy: { createdAt: "desc" }, take: Math.min(+take, 500) });
  }
}
@Global() @Module({ providers: [AuditService], controllers: [AuditController], exports: [AuditService] })
export class AuditModule {}
