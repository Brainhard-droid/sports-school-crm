import { db } from '../db';
import { 
  branchSections, 
  branches, 
  sportsSections, 
  type BranchSection, 
  type InsertBranchSection 
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { ApiErrorClass } from '../middleware/error';
import { BranchService } from './branchService';
import { SectionService } from './sectionService';

/**
 * Сервис для работы со связями филиалов и спортивных секций
 */
export class BranchSectionService {
  /**
   * Получить все связи филиалов и секций с фильтрацией по активности
   */
  static async getAllBranchSections(showAll: boolean = false): Promise<BranchSection[]> {
    try {
      if (!showAll) {
        return await db
          .select()
          .from(branchSections)
          .where(eq(branchSections.active, true));
      } else {
        return await db.select().from(branchSections);
      }
    } catch (error) {
      console.error('Error getting branch sections:', error);
      throw new ApiErrorClass('Ошибка при получении связей филиалов и секций', 500);
    }
  }

  /**
   * Получить связь филиала и секции по ID
   */
  static async getBranchSectionById(id: number): Promise<BranchSection> {
    try {
      const [branchSection] = await db
        .select()
        .from(branchSections)
        .where(eq(branchSections.id, id));
      
      if (!branchSection) {
        throw new ApiErrorClass('Связь филиала и секции не найдена', 404);
      }
      
      return branchSection;
    } catch (error) {
      if (error instanceof ApiErrorClass) throw error;
      console.error('Error getting branch section by ID:', error);
      throw new ApiErrorClass('Ошибка при получении связи филиала и секции', 500);
    }
  }

  /**
   * Получить филиалы по ID секции
   */
  static async getBranchesBySectionId(sectionId: number): Promise<any[]> {
    try {
      const results = await db
        .select({
          id: branches.id,
          name: branches.name,
          address: branches.address,
          phone: branches.phone,
          active: branches.active,
          branchSectionId: branchSections.id,
          schedule: branchSections.schedule,
        })
        .from(branchSections)
        .innerJoin(branches, eq(branches.id, branchSections.branchId))
        .where(
          and(
            eq(branchSections.sectionId, sectionId),
            eq(branches.active, true),
            eq(branchSections.active, true)
          )
        );
      
      return results;
    } catch (error) {
      console.error('Error getting branches by section:', error);
      throw new ApiErrorClass('Ошибка при получении филиалов по секции', 500);
    }
  }

  /**
   * Создать новую связь филиала и секции
   */
  static async createBranchSection(branchSectionData: InsertBranchSection): Promise<BranchSection> {
    try {
      // Проверяем существование филиала и секции
      await BranchService.getBranchById(branchSectionData.branchId);
      await SectionService.getSectionById(branchSectionData.sectionId);
      
      // Проверяем, что такой связи еще нет
      const existingLinks = await db
        .select()
        .from(branchSections)
        .where(
          and(
            eq(branchSections.branchId, branchSectionData.branchId),
            eq(branchSections.sectionId, branchSectionData.sectionId),
            eq(branchSections.active, true)
          )
        );
      
      if (existingLinks.length > 0) {
        throw new ApiErrorClass('Такая связь филиала и секции уже существует', 400);
      }
      
      const [newBranchSection] = await db
        .insert(branchSections)
        .values({
          ...branchSectionData,
          active: true
        })
        .returning();
      
      return newBranchSection;
    } catch (error) {
      if (error instanceof ApiErrorClass) throw error;
      console.error('Error creating branch section:', error);
      throw new ApiErrorClass('Ошибка при создании связи филиала и секции', 500);
    }
  }

  /**
   * Обновить связь филиала и секции
   */
  static async updateBranchSection(id: number, branchSectionData: Partial<InsertBranchSection>): Promise<BranchSection> {
    try {
      // Проверяем существование связи
      await this.getBranchSectionById(id);
      
      // Если изменяется филиал или секция, проверяем их существование
      if (branchSectionData.branchId) {
        await BranchService.getBranchById(branchSectionData.branchId);
      }
      
      if (branchSectionData.sectionId) {
        await SectionService.getSectionById(branchSectionData.sectionId);
      }
      
      const [updatedBranchSection] = await db
        .update(branchSections)
        .set(branchSectionData)
        .where(eq(branchSections.id, id))
        .returning();
      
      return updatedBranchSection;
    } catch (error) {
      if (error instanceof ApiErrorClass) throw error;
      console.error('Error updating branch section:', error);
      throw new ApiErrorClass('Ошибка при обновлении связи филиала и секции', 500);
    }
  }

  /**
   * Удалить связь филиала и секции (мягкое удаление - установка active = false)
   */
  static async deleteBranchSection(id: number): Promise<void> {
    try {
      // Проверяем существование связи
      await this.getBranchSectionById(id);
      
      // Мягкое удаление
      await db
        .update(branchSections)
        .set({
          active: false
        })
        .where(eq(branchSections.id, id));
    } catch (error) {
      if (error instanceof ApiErrorClass) throw error;
      console.error('Error deleting branch section:', error);
      throw new ApiErrorClass('Ошибка при удалении связи филиала и секции', 500);
    }
  }

  /**
   * Синхронизировать связи филиалов и секций
   * Пересоздает все связи на основе текущих данных в базе
   */
  static async syncBranchSections(): Promise<void> {
    try {
      // Получаем все филиалы и секции
      const allBranches = await BranchService.getAllBranches(true);
      const allSections = await SectionService.getAllSections(true);
      
      // Здесь можно реализовать логику синхронизации связей
      // В данном примере просто логируем информацию
      console.log('Синхронизация связей филиалов и секций...');
      console.log(`Филиалов: ${allBranches.length}, Секций: ${allSections.length}`);
    } catch (error) {
      console.error('Error syncing branch sections:', error);
      throw new ApiErrorClass('Ошибка при синхронизации связей филиалов и секций', 500);
    }
  }
}