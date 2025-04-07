import { IStorage } from '../interfaces/storage';
import { 
  messages,
  users,
  sessions
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
  
  // Методы для работы с сообщениями чата
  async getMessages() {
    try {
      return await db
        .select()
        .from(messages)
        .orderBy(messages.createdAt);
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }
  
  async getMessagesBySessionId(sessionId: string) {
    try {
      return await db
        .select()
        .from(messages)
        .where(eq(messages.sessionId, sessionId))
        .orderBy(messages.createdAt);
    } catch (error) {
      console.error('Error getting messages by session ID:', error);
      throw error;
    }
  }
  
  async createMessage(data: any) {
    try {
      const [message] = await db
        .insert(messages)
        .values(data)
        .returning();
      
      return message;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }
  
  // Методы для работы с сессиями
  async getSessions() {
    try {
      return await db
        .select()
        .from(sessions);
    } catch (error) {
      console.error('Error getting sessions:', error);
      throw error;
    }
  }
  
  async getSessionById(id: string) {
    try {
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, id));
      
      return session;
    } catch (error) {
      console.error('Error getting session by ID:', error);
      throw error;
    }
  }
  
  // Другие общие методы
}