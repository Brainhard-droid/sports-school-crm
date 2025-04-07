import { BranchSection, InsertBranchSection, branchSections } from "@shared/schema";
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { IBranchSectionStorage } from "../interfaces/storage";

/**
 * Реализация хранилища связей филиал-секция
 */
export class BranchSectionStorage implements IBranchSectionStorage {
  /**
   * Получает все связи филиал-секция
   * 
   * @param active Если true, возвращает только активные связи
   * @returns Массив связей
   */
  async getAllBranchSections(active?: boolean): Promise<BranchSection[]> {
    try {
      let query = db.select().from(branchSections);
      
      if (active !== undefined) {
        query = query.where(eq(branchSections.active, active));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting all branch sections:', error);
      throw error;
    }
  }
  
  /**
   * Получает связь по ID
   * 
   * @param id ID связи
   * @returns Связь или undefined, если не найдена
   */
  async getBranchSectionById(id: number): Promise<BranchSection | undefined> {
    try {
      const [branchSection] = await db
        .select()
        .from(branchSections)
        .where(eq(branchSections.id, id));
      
      return branchSection;
    } catch (error) {
      console.error('Error getting branch section by ID:', error);
      throw error;
    }
  }
  
  /**
   * Получает связи по ID филиала
   * 
   * @param branchId ID филиала
   * @param active Если true, возвращает только активные связи
   * @returns Массив связей
   */
  async getBranchSectionsByBranchId(branchId: number, active?: boolean): Promise<BranchSection[]> {
    try {
      let query = db
        .select()
        .from(branchSections)
        .where(eq(branchSections.branchId, branchId));
      
      if (active !== undefined) {
        query = query.where(and(
          eq(branchSections.branchId, branchId),
          eq(branchSections.active, active)
        ));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting branch sections by branch ID:', error);
      throw error;
    }
  }
  
  /**
   * Получает связи по ID секции
   * 
   * @param sectionId ID секции
   * @param active Если true, возвращает только активные связи
   * @returns Массив связей
   */
  async getBranchSectionsBySectionId(sectionId: number, active?: boolean): Promise<BranchSection[]> {
    try {
      let query = db
        .select()
        .from(branchSections)
        .where(eq(branchSections.sectionId, sectionId));
      
      if (active !== undefined) {
        query = query.where(and(
          eq(branchSections.sectionId, sectionId),
          eq(branchSections.active, active)
        ));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting branch sections by section ID:', error);
      throw error;
    }
  }
  
  /**
   * Создает новую связь филиал-секция
   * 
   * @param data Данные для создания связи
   * @returns Созданная связь
   */
  async createBranchSection(data: InsertBranchSection): Promise<BranchSection> {
    try {
      const [branchSection] = await db
        .insert(branchSections)
        .values(data)
        .returning();
      
      return branchSection;
    } catch (error) {
      console.error('Error creating branch section:', error);
      throw error;
    }
  }
  
  /**
   * Обновляет связь
   * 
   * @param id ID связи
   * @param data Данные для обновления
   * @returns Обновленная связь
   */
  async updateBranchSection(id: number, data: Partial<InsertBranchSection>): Promise<BranchSection> {
    try {
      const [branchSection] = await db
        .update(branchSections)
        .set(data)
        .where(eq(branchSections.id, id))
        .returning();
      
      return branchSection;
    } catch (error) {
      console.error('Error updating branch section:', error);
      throw error;
    }
  }
  
  /**
   * Удаляет связь (помечает как неактивную)
   * 
   * @param id ID связи
   * @returns true, если успешно удалена
   */
  async deleteBranchSection(id: number): Promise<boolean> {
    try {
      const [branchSection] = await db
        .update(branchSections)
        .set({ active: false })
        .where(eq(branchSections.id, id))
        .returning();
      
      return !!branchSection;
    } catch (error) {
      console.error('Error deleting branch section:', error);
      throw error;
    }
  }
  
  /**
   * Обновляет расписание для связи
   * 
   * @param id ID связи
   * @param schedule Новое расписание
   * @returns Обновленная связь
   */
  async updateBranchSectionSchedule(id: number, schedule: any): Promise<BranchSection> {
    try {
      const [branchSection] = await db
        .update(branchSections)
        .set({ schedule })
        .where(eq(branchSections.id, id))
        .returning();
      
      return branchSection;
    } catch (error) {
      console.error('Error updating branch section schedule:', error);
      throw error;
    }
  }
}