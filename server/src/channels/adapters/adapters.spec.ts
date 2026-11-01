import { TelegramBotAdapter } from "./telegram-bot";
import { VkAdapter } from "./vk";
const ctx = (config: any) => ({ secret: "x", config, webhookUrl: "" });
describe("TelegramBotAdapter.parse", () => {
  it("разбирает текст и проверяет секрет", () => {
    const a = new TelegramBotAdapter();
    const body = { message: { message_id: 5, chat: { id: 42 }, from: { first_name: "Анна" }, text: "Привет" } };
    expect(a.parse(ctx({ hookSecret: "s" }), body, { "x-telegram-bot-api-secret-token": "s" }).messages[0]).toMatchObject({ externalChatId: "42", text: "Привет", name: "Анна" });
    expect(a.parse(ctx({ hookSecret: "s" }), body, {}).messages).toHaveLength(0);
  });
});
describe("VkAdapter.parse", () => {
  const a = new VkAdapter();
  it("отвечает кодом подтверждения", () => expect(a.parse(ctx({ confirmation: "abc" }), { type: "confirmation" }).reply).toBe("abc"));
  it("разбирает message_new", () => expect(a.parse(ctx({ secret: "k" }), { type: "message_new", secret: "k", object: { message: { peer_id: 7, id: 1, text: "Цена?" } } }).messages[0].text).toBe("Цена?"));
});
