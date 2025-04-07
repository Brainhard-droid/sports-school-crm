import { Branch, InsertBranch, branches } from "@shared/schema";
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { IBranchStorage } from "../interfaces/storage";

/**
 * Реализация хранилища филиалов
 */
export class BranchStorage implements IBranchStorage {
  /**
   * Получает все филиалы
   * 
   * @param active Если true, возвращает только активные филиалы
   * @returns Массив филиалов
   */
  async getAllBranches(active?: boolean): Promise<Branch[]> {
    try {
      let query = db.select().from(branches);
      
      if (active !== undefined) {
        query = query.where(eq(branches.active, active));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting all branches:', error);
      throw error;
    }
  }
  
  /**
   * Получает филиал по ID
   * 
   * @param id ID филиала
   * @returns Филиал или undefined, если не найден
   */
  async getBranchById(id: number): Promise<Branch | undefined> {
    try {
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, id));
      
      return branch;
    } catch (error) {
      console.error('Error getting branch by ID:', error);
      throw error;
    }
  }
  
  /**
   * Создает новый филиал
   * 
   * @param data Данные для создания филиала
   * @returns Созданный филиал
   */
  async createBranch(data: InsertBranch): Promise<Branch> {
    try {
      const [branch] = await db
        .insert(branches)
        .values(data)
        .returning();
      
      return branch;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }
  
  /**
   * Обновляет филиал
   * 
   * @param id ID филиала
   * @param data Данные для обновления
   * @returns Обновленный филиал
   */
  async updateBranch(id: number, data: Partial<InsertBranch>): Promise<Branch> {
    try {
      const [branch] = await db
        .update(branches)
        .set(data)
        .where(eq(branches.id, id))
        .returning();
      
      return branch;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }
  
  /**
   * Удаляет филиал (помечает как неактивный)
   * 
   * @param id ID филиала
   * @returns true, если успешно удален
   */
  async deleteBranch(id: number): Promise<boolean> {
    try {
      const [branch] = await db
        .update(branches)
        .set({ active: false })
        .where(eq(branches.id, id))
        .returning();
      
      return !!branch;
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  }
}