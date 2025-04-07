import { db } from '../db';
import { sportsSections, type SportsSection, type InsertSportsSection } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { ApiErrorClass } from '../middleware/error';

/**
 * Сервис для работы с спортивными секциями
 */
export class SectionService {
  /**
   * Получить все спортивные секции с фильтрацией по активности
   */
  static async getAllSections(activeOnly: boolean = true): Promise<SportsSection[]> {
    try {
      if (activeOnly) {
        return await db
          .select()
          .from(sportsSections)
          .where(eq(sportsSections.active, true));
      } else {
        return await db.select().from(sportsSections);
      }
    } catch (error) {
      console.error('Error getting sections:', error);
      throw new ApiErrorClass('Ошибка при получении спортивных секций', 500);
    }
  }

  /**
   * Получить спортивную секцию по ID
   */
  static async getSectionById(id: number): Promise<SportsSection> {
    try {
      const [section] = await db
        .select()
        .from(sportsSections)
        .where(eq(sportsSections.id, id));
      
      if (!section) {
        throw new ApiErrorClass('Спортивная секция не найдена', 404);
      }
      
      return section;
    } catch (error) {
      if (error instanceof ApiErrorClass) throw error;
      console.error('Error getting section by ID:', error);
      throw new ApiErrorClass('Ошибка при получении спортивной секции', 500);
    }
  }

  /**
   * Создать новую спортивную секцию
   */
  static async createSection(sectionData: InsertSportsSection): Promise<SportsSection> {
    try {
      const [newSection] = await db
        .insert(sportsSections)
        .values({
          ...sectionData,
          active: true,
        })
        .returning();
      
      return newSection;
    } catch (error) {
      console.error('Error creating section:', error);
      throw new ApiErrorClass('Ошибка при создании спортивной секции', 500);
    }
  }

  /**
   * Обновить спортивную секцию
   */
  static async updateSection(id: number, sectionData: Partial<InsertSportsSection>): Promise<SportsSection> {
    try {
      // Проверяем существование секции
      await this.getSectionById(id);
      
      const [updatedSection] = await db
        .update(sportsSections)
        .set(sectionData)
        .where(eq(sportsSections.id, id))
        .returning();
      
      return updatedSection;
    } catch (error) {
      if (error instanceof ApiErrorClass) throw error;
      console.error('Error updating section:', error);
      throw new ApiErrorClass('Ошибка при обновлении спортивной секции', 500);
    }
  }

  /**
   * Удалить спортивную секцию (мягкое удаление - установка active = false)
   */
  static async deleteSection(id: number): Promise<void> {
    try {
      // Проверяем существование секции
      await this.getSectionById(id);
      
      // Мягкое удаление
      await db
        .update(sportsSections)
        .set({
          active: false
        })
        .where(eq(sportsSections.id, id));
    } catch (error) {
      if (error instanceof ApiErrorClass) throw error;
      console.error('Error deleting section:', error);
      throw new ApiErrorClass('Ошибка при удалении спортивной секции', 500);
    }
  }
}