import { Body, Controller, Injectable, Module, Post, ServiceUnavailableException } from "@nestjs/common";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser, Roles, User } from "../common/auth";
/** Yandex AI Studio, OpenAI-совместимый endpoint. Данные остаются в РФ. В промпт не передаём телефон/ФИО полностью. */
@Injectable()
export class AiService {
  async chat(system: string, user: string): Promise<string> {
    const key = process.env.YANDEX_AI_API_KEY, folder = process.env.YANDEX_AI_FOLDER_ID;
    if (!key || !folder) throw new ServiceUnavailableException("ИИ не настроен: нужен YANDEX_AI_API_KEY и YANDEX_AI_FOLDER_ID");
    const r = await fetch("https://llm.api.cloud.yandex.net/v1/chat/completions", { method: "POST", headers: { Authorization: `Api-Key ${key}`, "OpenAI-Project": folder, "content-type": "application/json" },
      body: JSON.stringify({ model: `gpt://${folder}/${process.env.YANDEX_AI_MODEL || "gpt-oss-120b/latest"}`, temperature: 0.3, max_tokens: 400, messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
    const j: any = await r.json(); return j.choices?.[0]?.message?.content?.trim() || "";
  }
}
const SYS = "Ты администратор частной клиники. Отвечай по-русски, вежливо, кратко, на «вы». Никогда не ставь диагнозы и не назначай лечение. Если вопрос медицинский — предложи запись к врачу.";
class DraftDto { @IsString() conversationId: string; @IsOptional() @IsString() partial?: string }
class RewriteDto { @IsString() text: string; @IsIn(["polite", "short", "warm", "formal", "fix"]) mode: string }
@Controller("ai") @Roles("owner", "admin")
export class AiController {
  constructor(private ai: AiService, private db: PrismaService) {}
  @Post("draft") async draft(@User() u: AuthUser, @Body() d: DraftDto) {
    const msgs = await this.db.message.findMany({ where: { conversation: { id: d.conversationId, clinicId: u.clinicId } }, orderBy: { createdAt: "desc" }, take: 12 });
    const hist = msgs.reverse().map(m => (m.direction === "in" ? "Пациент: " : "Клиника: ") + m.text).join("\n");
    return { text: await this.ai.chat(SYS, `Переписка:\n${hist}\n\nНапиши следующий ответ клиники${d.partial ? `, продолжив начало: «${d.partial}»` : ""}.`) };
  }
  @Post("rewrite") async rewrite(@Body() d: RewriteDto) {
    const how: any = { polite: "вежливее", short: "короче", warm: "теплее", formal: "официальнее", fix: "без ошибок, не меняя смысла" };
    return { text: await this.ai.chat(SYS, `Перепиши ${how[d.mode]}: ${d.text}`) };
  }
}
@Module({ providers: [AiService], controllers: [AiController] })
export class AiModule {}
