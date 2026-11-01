import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  const allowed = (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
  const originOk = (o: string) => allowed.some(a => a.startsWith("*.") ? (() => { try { const h = new URL(o).hostname; return h.endsWith(a.slice(1)) && new URL(o).protocol === "https:"; } catch { return false; } })() : a === o);
  app.enableCors({ origin: (o: string | undefined, cb: (e: Error | null, ok?: boolean) => void) => cb(null, !o || originOk(o)), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix("api", { exclude: ["webhooks/(.*)", "health"] });
  await app.listen(+(process.env.PORT || 4000));
}
bootstrap();
