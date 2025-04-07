import { User, InsertUser } from "@shared/schema";

/**
 * Интерфейс для хранилища пользователей
 */
export interface IUserStorage {
  /**
   * Получает пользователя по ID
   * 
   * @param id ID пользователя
   * @returns Пользователь или undefined, если не найден
   */
  getUser(id: number): Promise<User | undefined>;
  
  /**
   * Получает пользователя по имени пользователя
   * 
   * @param username Имя пользователя
   * @returns Пользователь или undefined, если не найден
   */
  getUserByUsername(username: string): Promise<User | undefined>;
  
  /**
   * Создает нового пользователя
   * 
   * @param insertUser Данные для создания пользователя
   * @returns Созданный пользователь
   */
  createUser(insertUser: InsertUser): Promise<User>;
}