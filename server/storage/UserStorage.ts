import { User, InsertUser, users } from "@shared/schema";
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { IUserStorage } from "../interfaces/storage";

/**
 * Реализация хранилища пользователей
 */
export class UserStorage implements IUserStorage {
  /**
   * Получает пользователя по ID
   * 
   * @param id ID пользователя
   * @returns Пользователь или undefined, если не найден
   */
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }
  
  /**
   * Получает пользователя по имени пользователя
   * 
   * @param username Имя пользователя
   * @returns Пользователь или undefined, если не найден
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }
  
  /**
   * Создает нового пользователя
   * 
   * @param insertUser Данные для создания пользователя
   * @returns Созданный пользователь
   */
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
}