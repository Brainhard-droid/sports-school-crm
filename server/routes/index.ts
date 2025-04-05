import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Placeholder для функции отправки уведомлений
export async function sendTrialAssignmentNotification(request: any): Promise<void> {
  console.log(`Sending notification for trial request ${request.id}...`);
  // Добавить логику отправки уведомлений (например, через email, SMS и т.д.)
  // TODO: Реализовать отправку уведомлений
}