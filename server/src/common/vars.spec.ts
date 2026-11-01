import { fillVars } from "./vars";
import { maskPhone } from "./auth";
describe("fillVars", () => {
  it("подставляет известные переменные и оставляет неизвестные", () => {
    expect(fillVars("{имя}, приём {дата} в {время}, {x}", { "имя": "Анна", "дата": "6 ноября", "время": "14:00" })).toBe("Анна, приём 6 ноября в 14:00, {x}");
  });
});
describe("maskPhone", () => {
  it("маскирует для врача", () => expect(maskPhone("+79991234547", "doctor")).toBe("+7 (9••) •••-••-47"));
  it("не маскирует для админа", () => expect(maskPhone("+79991234547", "admin")).toBe("+79991234547"));
});
