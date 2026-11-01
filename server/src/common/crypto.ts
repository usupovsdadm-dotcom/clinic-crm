import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
const key = () => Buffer.from(process.env.SECRETS_KEY || "", "hex");
export function enc(s: string) { const iv = randomBytes(12); const c = createCipheriv("aes-256-gcm", key(), iv); const d = Buffer.concat([c.update(s, "utf8"), c.final()]); return [iv, c.getAuthTag(), d].map(b => b.toString("base64")).join("."); }
export function dec(s: string) { const [iv, tag, d] = s.split(".").map(x => Buffer.from(x, "base64")); const c = createDecipheriv("aes-256-gcm", key(), iv); c.setAuthTag(tag); return Buffer.concat([c.update(d), c.final()]).toString("utf8"); }
