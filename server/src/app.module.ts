import { Controller, Get, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.service";
import { AuthGuard, Public } from "./common/auth";
import { AuditModule } from "./audit/audit";
import { AuthModule } from "./auth/auth";
import { PatientsModule } from "./patients/patients";
import { AppointmentsModule } from "./appointments/appointments";
import { TemplatesModule } from "./templates/templates";
import { ChannelsModule } from "./channels/channels";
import { ConversationsModule } from "./conversations/conversations";
import { AiModule } from "./ai/ai";
@Controller() class Health { @Public() @Get("health") h() { return { ok: true }; } }
@Module({
  imports: [PrismaModule, JwtModule.register({ global: true, secret: process.env.JWT_SECRET || "dev-secret", signOptions: { expiresIn: "12h" } }), ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    AuditModule, AuthModule, PatientsModule, AppointmentsModule, TemplatesModule, ChannelsModule, ConversationsModule, AiModule],
  controllers: [Health],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
