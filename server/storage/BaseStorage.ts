import { IStorage } from '../interfaces/storage';
import { 
  users
} from '@shared/schema';
import session from 'express-session';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import connectPgSimple from 'connect-pg-simple';

/**
 * Базовый класс для основного хранилища
 * Содержит общие методы, которые нельзя разнести по отдельным хранилищам
 */
export class BaseStorage implements Partial<IStorage> {
  sessionStore: session.Store;
  
  constructor() {
    // Создаем хранилище сессий
    const PgStore = connectPgSimple(session);
    this.sessionStore = new PgStore({
      pool: (db as any).$pool,
      tableName: 'sessions',
      createTableIfMissing: true
    });
  }
  
  // Базовые методы для работы с WebSocket сообщениями будут добавлены позже
  // Пока это заглушки
  async getMessages() {
    return [];
  }
  
  async getMessagesBySessionId(sessionId: string) {
    return [];
  }
  
  async createMessage(data: any) {
    console.log('Creating message (stub)', data);
    return { id: 0, ...data, createdAt: new Date() };
  }
  
  // Другие общие методы
}