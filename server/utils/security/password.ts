import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

/**
 * Хэширует пароль с использованием scrypt и случайной соли
 * 
 * @param password Пароль для хэширования
 * @returns Строка в формате "хэш.соль"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Сверяет предоставленный пароль с сохраненным хэшем
 * 
 * @param supplied Предоставленный пароль
 * @param stored Сохраненный хэш в формате "хэш.соль"
 * @returns true, если пароли совпадают
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}