import { Group, InsertGroup, Student } from '@shared/schema';

/**
 * Интерфейс хранилища групп
 * Определяет методы для работы с группами
 */
export interface IGroupStorage {
  /**
   * Получает все группы
   * 
   * @returns Массив групп
   */
  getGroups(): Promise<Group[]>;
  
  /**
   * Получает группу по ID
   * 
   * @param id ID группы
   * @returns Группа или undefined, если не найдена
   */
  getGroup(id: number): Promise<Group | undefined>;
  
  /**
   * Создает новую группу
   * 
   * @param group Данные для создания группы
   * @returns Созданная группа
   */
  createGroup(group: InsertGroup): Promise<Group>;
  
  /**
   * Получает список студентов в группе с подробными данными
   * 
   * @param groupId ID группы
   * @returns Массив студентов
   */
  getGroupStudentsWithDetails(groupId: number): Promise<Student[]>;
  
  /**
   * Удаляет группу
   * 
   * @param id ID группы
   */
  deleteGroup(id: number): Promise<void>;
}