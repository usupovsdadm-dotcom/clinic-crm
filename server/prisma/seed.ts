import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const c = await db.clinic.upsert({ where: { slug: "demo" }, update: {}, create: { name: "Клиника «Здоровье» (демо)", slug: "demo" } });
  const d1 = await db.doctor.create({ data: { clinicId: c.id, name: "Иванов А.В.", specialty: "Терапевт", room: "3" } });
  await db.doctor.create({ data: { clinicId: c.id, name: "Белова Е.С.", specialty: "Гинеколог", room: "5" } });
  const pw = await bcrypt.hash("demo1234", 10);
  await db.user.createMany({ data: [
    { clinicId: c.id, email: "owner@demo.ru", password: pw, name: "Владелец", role: "owner" },
    { clinicId: c.id, email: "admin@demo.ru", password: pw, name: "Мария (админ)", role: "admin" }], skipDuplicates: true });
  await db.user.upsert({ where: { email: "doctor@demo.ru" }, update: {}, create: { clinicId: c.id, email: "doctor@demo.ru", password: pw, name: "Иванов А.В.", role: "doctor", doctorId: d1.id } });
  const p = await db.patient.create({ data: { clinicId: c.id, fullName: "Смирнова Анна Викторовна", phone: "+79990000047", consentMailing: true, consentAt: new Date() } });
  const ch = await db.channel.create({ data: { clinicId: c.id, type: "telegram_bot", title: "Демо-бот", status: "demo" } });
  const cv = await db.conversation.create({ data: { clinicId: c.id, channelId: ch.id, patientId: p.id, externalChatId: "demo-1", unread: 1, lastInboundAt: new Date() } });
  await db.message.create({ data: { conversationId: cv.id, direction: "in", text: "Можно перенести запись на пятницу?", status: "received" } });
  const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(14, 0, 0, 0);
  await db.appointment.create({ data: { clinicId: c.id, doctorId: d1.id, patientId: p.id, startsAt: t, endsAt: new Date(t.getTime() + 30 * 60000), service: "Первичный приём" } });
  await db.template.createMany({ data: [
    { clinicId: c.id, name: "Подтверждение записи", category: "Запись", body: "{имя}, вы записаны к врачу {врач} на {дата} в {время}. Адрес: {адрес}", favorite: true },
    { clinicId: c.id, name: "Напоминание за сутки", category: "Напоминание", body: "{имя}, напоминаем о приёме завтра в {время}. Ответьте «Да» для подтверждения." }] });
  console.log("seed ok: admin@demo.ru / demo1234");
}
main().finally(() => db.$disconnect());
