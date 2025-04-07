import { SportsSection, InsertSportsSection } from "@shared/schema";

/**
 * Интерфейс для хранилища спортивных секций
 */
export interface ISectionStorage {
  /**
   * Получает все секции
   * 
   * @param active Если true, возвращает только активные секции
   * @returns Массив секций
   */
  getAllSections(active?: boolean): Promise<SportsSection[]>;
  
  /**
   * Получает секцию по ID
   * 
   * @param id ID секции
   * @returns Секция или undefined, если не найдена
   */
  getSectionById(id: number): Promise<SportsSection | undefined>;
  
  /**
   * Создает новую секцию
   * 
   * @param data Данные для создания секции
   * @returns Созданная секция
   */
  createSection(data: InsertSportsSection): Promise<SportsSection>;
  
  /**
   * Обновляет секцию
   * 
   * @param id ID секции
   * @param data Данные для обновления
   * @returns Обновленная секция
   */
  updateSection(id: number, data: Partial<InsertSportsSection>): Promise<SportsSection>;
  
  /**
   * Удаляет секцию (помечает как неактивную)
   * 
   * @param id ID секции
   * @returns true, если успешно удалена
   */
  deleteSection(id: number): Promise<boolean>;
}