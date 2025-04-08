import { attendance, AttendanceStatus, type Attendance, type InsertAttendance, type AttendanceStatusType } from '@shared/schema';
import { db } from '../db';
import { and, eq } from 'drizzle-orm';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { IAttendanceStorage } from '../interfaces/storage/IAttendanceStorage';

/**
 * Класс для работы с посещаемостью
 */
export class AttendanceStorage implements IAttendanceStorage {
  /**
   * Получает записи о посещаемости для группы на определенную дату
   * 
   * @param groupId ID группы
   * @param date Дата
   * @returns Массив записей о посещаемости
   */
  async getAttendance(groupId: number, date: Date): Promise<Attendance[]> {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    return await db.select()
      .from(attendance)
      .where(
        and(
          eq(attendance.groupId, groupId),
          eq(attendance.date, formattedDate)
        )
      );
  }
  
  /**
   * Получает запись о посещаемости по ID
   * 
   * @param id ID записи
   * @returns Запись о посещаемости или undefined, если запись не найдена
   */
  async getAttendanceById(id: number): Promise<Attendance | undefined> {
    const [record] = await db.select()
      .from(attendance)
      .where(eq(attendance.id, id));
    
    return record;
  }
  
  /**
   * Обновляет существующую запись о посещаемости
   * 
   * @param id ID записи
   * @param data Данные для обновления
   * @returns Обновленная запись
   */
  async updateAttendance(id: number, data: { status: AttendanceStatusType }): Promise<Attendance> {
    const [updated] = await db.update(attendance)
      .set({ status: data.status })
      .where(eq(attendance.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Запись о посещаемости с ID ${id} не найдена`);
    }
    
    return updated;
  }
  
  /**
   * Создает новую запись о посещаемости
   * 
   * @param data Данные для создания записи
   * @returns Созданная запись
   */
  async createAttendance(data: InsertAttendance): Promise<Attendance> {
    console.log('Creating attendance record:', data);
    
    // Проверяем, существует ли уже запись о посещаемости для этого студента/группы/даты
    const formattedDate = format(new Date(data.date), 'yyyy-MM-dd');
    const existingAttendance = await db.select()
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, data.studentId),
          eq(attendance.groupId, data.groupId),
          eq(attendance.date, formattedDate)
        )
      );
    
    if (existingAttendance.length > 0) {
      // Обновляем существующую запись
      console.log('Updating existing attendance record');
      const [updated] = await db.update(attendance)
        .set({ status: data.status })
        .where(eq(attendance.id, existingAttendance[0].id))
        .returning();
      
      return updated;
    } else {
      // Создаем новую запись
      console.log('Creating new attendance record');
      const [newAttendance] = await db.insert(attendance)
        .values({
          studentId: data.studentId,
          groupId: data.groupId,
          date: formattedDate,
          status: data.status
        })
        .returning();
      
      return newAttendance;
    }
  }
  
  /**
   * Получает записи о посещаемости для группы за месяц
   * 
   * @param groupId ID группы
   * @param month Месяц (1-12)
   * @param year Год
   * @returns Массив записей о посещаемости
   */
  async getAttendanceByMonth(groupId: number, month: number, year: number): Promise<Attendance[]> {
    // Получаем первый и последний день месяца
    const firstDay = startOfMonth(new Date(year, month - 1));
    const lastDay = endOfMonth(new Date(year, month - 1));
    
    // Форматируем даты для SQL запроса
    const firstDayStr = format(firstDay, 'yyyy-MM-dd');
    const lastDayStr = format(lastDay, 'yyyy-MM-dd');
    
    console.log(`Getting attendance for group ${groupId} from ${firstDayStr} to ${lastDayStr}`);
    
    // Используем строковое сравнение дат для PostgreSQL
    return await db.select()
      .from(attendance)
      .where(
        and(
          eq(attendance.groupId, groupId)
        )
      )
      // Фильтруем результаты после получения из базы данных
      .then(results => {
        return results.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= firstDay && recordDate <= lastDay;
        });
      });
  }
}