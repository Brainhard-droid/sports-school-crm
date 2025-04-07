import { Branch, InsertBranch } from "@shared/schema";

/**
 * Интерфейс для хранилища филиалов
 */
export interface IBranchStorage {
  /**
   * Получает все филиалы
   * 
   * @param active Если true, возвращает только активные филиалы
   * @returns Массив филиалов
   */
  getAllBranches(active?: boolean): Promise<Branch[]>;
  
  /**
   * Получает филиал по ID
   * 
   * @param id ID филиала
   * @returns Филиал или undefined, если не найден
   */
  getBranchById(id: number): Promise<Branch | undefined>;
  
  /**
   * Создает новый филиал
   * 
   * @param data Данные для создания филиала
   * @returns Созданный филиал
   */
  createBranch(data: InsertBranch): Promise<Branch>;
  
  /**
   * Обновляет филиал
   * 
   * @param id ID филиала
   * @param data Данные для обновления
   * @returns Обновленный филиал
   */
  updateBranch(id: number, data: Partial<InsertBranch>): Promise<Branch>;
  
  /**
   * Удаляет филиал (помечает как неактивный)
   * 
   * @param id ID филиала
   * @returns true, если успешно удален
   */
  deleteBranch(id: number): Promise<boolean>;
}