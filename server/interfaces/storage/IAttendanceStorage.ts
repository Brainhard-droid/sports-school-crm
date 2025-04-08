import { Attendance, InsertAttendance, AttendanceStatusType } from "@shared/schema";

/**
 * Интерфейс для хранилища посещаемости
 */
export interface IAttendanceStorage {
  /**
   * Получает записи о посещаемости для группы на определенную дату
   * 
   * @param groupId ID группы
   * @param date Дата
   * @returns Массив записей о посещаемости
   */
  getAttendance(groupId: number, date: Date): Promise<Attendance[]>;
  
  /**
   * Создает новую запись о посещаемости
   * 
   * @param attendance Данные для создания записи
   * @returns Созданная запись
   */
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  
  /**
   * Получает записи о посещаемости для группы за месяц
   * 
   * @param groupId ID группы
   * @param month Месяц (1-12)
   * @param year Год
   * @returns Массив записей о посещаемости
   */
  getAttendanceByMonth(groupId: number, month: number, year: number): Promise<Attendance[]>;
  
  /**
   * Получает запись о посещаемости по ID
   * 
   * @param id ID записи
   * @returns Запись о посещаемости или undefined, если запись не найдена
   */
  getAttendanceById(id: number): Promise<Attendance | undefined>;
  
  /**
   * Обновляет существующую запись о посещаемости
   * 
   * @param id ID записи
   * @param data Данные для обновления
   * @returns Обновленная запись
   */
  updateAttendance(id: number, data: { status: AttendanceStatusType }): Promise<Attendance>;
}