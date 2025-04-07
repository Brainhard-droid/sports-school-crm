import { SportsSection, InsertSportsSection, sportsSections } from "@shared/schema";
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { ISectionStorage } from "../interfaces/storage";

/**
 * Реализация хранилища спортивных секций
 */
export class SectionStorage implements ISectionStorage {
  /**
   * Получает все секции
   * 
   * @param active Если true, возвращает только активные секции
   * @returns Массив секций
   */
  async getAllSections(active?: boolean): Promise<SportsSection[]> {
    try {
      let query = db.select().from(sportsSections);
      
      if (active !== undefined) {
        query = query.where(eq(sportsSections.active, active));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting all sections:', error);
      throw error;
    }
  }
  
  /**
   * Получает секцию по ID
   * 
   * @param id ID секции
   * @returns Секция или undefined, если не найдена
   */
  async getSectionById(id: number): Promise<SportsSection | undefined> {
    try {
      const [section] = await db
        .select()
        .from(sportsSections)
        .where(eq(sportsSections.id, id));
      
      return section;
    } catch (error) {
      console.error('Error getting section by ID:', error);
      throw error;
    }
  }
  
  /**
   * Создает новую секцию
   * 
   * @param data Данные для создания секции
   * @returns Созданная секция
   */
  async createSection(data: InsertSportsSection): Promise<SportsSection> {
    try {
      const [section] = await db
        .insert(sportsSections)
        .values(data)
        .returning();
      
      return section;
    } catch (error) {
      console.error('Error creating section:', error);
      throw error;
    }
  }
  
  /**
   * Обновляет секцию
   * 
   * @param id ID секции
   * @param data Данные для обновления
   * @returns Обновленная секция
   */
  async updateSection(id: number, data: Partial<InsertSportsSection>): Promise<SportsSection> {
    try {
      const [section] = await db
        .update(sportsSections)
        .set(data)
        .where(eq(sportsSections.id, id))
        .returning();
      
      return section;
    } catch (error) {
      console.error('Error updating section:', error);
      throw error;
    }
  }
  
  /**
   * Удаляет секцию (помечает как неактивную)
   * 
   * @param id ID секции
   * @returns true, если успешно удалена
   */
  async deleteSection(id: number): Promise<boolean> {
    try {
      const [section] = await db
        .update(sportsSections)
        .set({ active: false })
        .where(eq(sportsSections.id, id))
        .returning();
      
      return !!section;
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  }
}