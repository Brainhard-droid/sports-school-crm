import { BranchSection, InsertBranchSection } from "@shared/schema";

/**
 * Интерфейс для хранилища связей филиал-секция
 */
export interface IBranchSectionStorage {
  /**
   * Получает все связи филиал-секция
   * 
   * @param active Если true, возвращает только активные связи
   * @returns Массив связей
   */
  getAllBranchSections(active?: boolean): Promise<BranchSection[]>;
  
  /**
   * Получает связь по ID
   * 
   * @param id ID связи
   * @returns Связь или undefined, если не найдена
   */
  getBranchSectionById(id: number): Promise<BranchSection | undefined>;
  
  /**
   * Получает связи по ID филиала
   * 
   * @param branchId ID филиала
   * @param active Если true, возвращает только активные связи
   * @returns Массив связей
   */
  getBranchSectionsByBranchId(branchId: number, active?: boolean): Promise<BranchSection[]>;
  
  /**
   * Получает связи по ID секции
   * 
   * @param sectionId ID секции
   * @param active Если true, возвращает только активные связи
   * @returns Массив связей
   */
  getBranchSectionsBySectionId(sectionId: number, active?: boolean): Promise<BranchSection[]>;
  
  /**
   * Создает новую связь филиал-секция
   * 
   * @param data Данные для создания связи
   * @returns Созданная связь
   */
  createBranchSection(data: InsertBranchSection): Promise<BranchSection>;
  
  /**
   * Обновляет связь
   * 
   * @param id ID связи
   * @param data Данные для обновления
   * @returns Обновленная связь
   */
  updateBranchSection(id: number, data: Partial<InsertBranchSection>): Promise<BranchSection>;
  
  /**
   * Удаляет связь (помечает как неактивную)
   * 
   * @param id ID связи
   * @returns true, если успешно удалена
   */
  deleteBranchSection(id: number): Promise<boolean>;
  
  /**
   * Обновляет расписание для связи
   * 
   * @param id ID связи
   * @param schedule Новое расписание
   * @returns Обновленная связь
   */
  updateBranchSectionSchedule(id: number, schedule: any): Promise<BranchSection>;
}