import { Schedule, InsertSchedule } from "@shared/schema";

/**
 * Интерфейс для хранилища расписаний
 */
export interface IScheduleStorage {
  /**
   * Получает расписания, опционально фильтруя по группе
   * 
   * @param groupId ID группы (опционально)
   * @returns Массив расписаний
   */
  getSchedules(groupId?: number): Promise<Schedule[]>;
  
  /**
   * Создает новое расписание
   * 
   * @param schedule Данные для создания расписания
   * @returns Созданное расписание
   */
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
}