/** Подстановка переменных шаблона: {имя} {дата} {время} {врач} {адрес} {ссылка_на_запись} */
export function fillVars(body: string, v: Record<string, string | undefined>) {
  return body.replace(/\{([а-яё_a-z]+)\}/gi, (m, k) => v[k.toLowerCase()] ?? m);
}
