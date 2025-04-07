import { db } from '../db';
import { branches, type Branch, type InsertBranch } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { ApiErrorClass } from '../middleware/error';

/**
 * Сервис для работы с филиалами
 */
export class BranchService {
  /**
   * Получить все филиалы с фильтрацией по активности
   */
  static async getAllBranches(activeOnly: boolean = true): Promise<Branch[]> {
    try {
      if (activeOnly) {
        return await db
          .select()
          .from(branches)
          .where(eq(branches.active, true));
      } else {
        return await db.select().from(branches);
      }
    } catch (error) {
      console.error('Error getting branches:', error);
      throw new ApiErrorClass('Ошибка при получении филиалов', 500);
    }
  }

  /**
   * Получить филиал по ID
   */
  static async getBranchById(id: number): Promise<Branch> {
    try {
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, id));
      
      if (!branch) {
        throw new ApiErrorClass('Филиал не найден', 404);
      }
      
      return branch;
    } catch (error) {
      if (error instanceof ApiErrorClass) throw error;
      console.error('Error getting branch by ID:', error);
      throw new ApiErrorClass('Ошибка при получении филиала', 500);
    }
  }

  /**
   * Создать новый филиал
   */
  static async createBranch(branchData: InsertBranch): Promise<Branch> {
    try {
      const [newBranch] = await db
        .insert(branches)
        .values({
          ...branchData,
          active: true,
        })
        .returning();
      
      return newBranch;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw new ApiErrorClass('Ошибка при создании филиала', 500);
    }
  }

  /**
   * Обновить филиал
   */
  static async updateBranch(id: number, branchData: Partial<InsertBranch>): Promise<Branch> {
    try {
      // Проверяем существование филиала
      await this.getBranchById(id);
      
      const [updatedBranch] = await db
        .update(branches)
        .set(branchData)
        .where(eq(branches.id, id))
        .returning();
      
      return updatedBranch;
    } catch (error) {
      if (error instanceof ApiErrorClass) throw error;
      console.error('Error updating branch:', error);
      throw new ApiErrorClass('Ошибка при обновлении филиала', 500);
    }
  }

  /**
   * Удалить филиал (мягкое удаление - установка active = false)
   */
  static async deleteBranch(id: number): Promise<void> {
    try {
      // Проверяем существование филиала
      await this.getBranchById(id);
      
      // Мягкое удаление
      await db
        .update(branches)
        .set({
          active: false
        })
        .where(eq(branches.id, id));
    } catch (error) {
      if (error instanceof ApiErrorClass) throw error;
      console.error('Error deleting branch:', error);
      throw new ApiErrorClass('Ошибка при удалении филиала', 500);
    }
  }
}