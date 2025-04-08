import { dateComments, type DateComment, type InsertDateComment } from '@shared/schema';
import { db } from '../db';
import { and, eq } from 'drizzle-orm';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { IDateCommentStorage } from '../interfaces/storage/IDateCommentStorage';

/**
 * Класс для работы с комментариями к датам
 */
export class DateCommentStorage implements IDateCommentStorage {
  /**
   * Получает комментарии к датам для группы за указанный месяц
   * 
   * @param groupId ID группы
   * @param month Месяц (1-12)
   * @param year Год
   * @returns Массив комментариев к датам
   */
  async getDateComments(groupId: number, month: number, year: number): Promise<DateComment[]> {
    // Получаем первый и последний день месяца
    const firstDay = startOfMonth(new Date(year, month - 1));
    const lastDay = endOfMonth(new Date(year, month - 1));
    
    // Форматируем даты для SQL запроса
    const firstDayStr = format(firstDay, 'yyyy-MM-dd');
    const lastDayStr = format(lastDay, 'yyyy-MM-dd');
    
    console.log(`Getting date comments for group ${groupId} from ${firstDayStr} to ${lastDayStr}`);
    
    // Получаем комментарии для группы из БД
    return await db.select()
      .from(dateComments)
      .where(
        and(
          eq(dateComments.groupId, groupId)
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
  
  /**
   * Создает новый комментарий к дате
   * 
   * @param comment Данные для создания комментария
   * @returns Созданный комментарий
   */
  async createDateComment(comment: InsertDateComment): Promise<DateComment> {
    // Проверяем, существует ли уже комментарий для этой группы/даты
    const formattedDate = format(new Date(comment.date), 'yyyy-MM-dd');
    const existingComment = await this.getDateComment(comment.groupId, new Date(comment.date));
    
    if (existingComment) {
      // Обновляем существующий комментарий
      console.log('Updating existing date comment');
      return await this.updateDateComment(existingComment.id, comment.comment);
    } else {
      // Создаем новый комментарий
      console.log('Creating new date comment');
      const [newComment] = await db.insert(dateComments)
        .values({
          groupId: comment.groupId,
          date: formattedDate,
          comment: comment.comment
        })
        .returning();
      
      return newComment;
    }
  }
  
  /**
   * Получает комментарий к дате по ID
   * 
   * @param id ID комментария
   * @returns Комментарий к дате или undefined, если комментарий не найден
   */
  async getDateCommentById(id: number): Promise<DateComment | undefined> {
    const [record] = await db.select()
      .from(dateComments)
      .where(eq(dateComments.id, id));
    
    return record;
  }
  
  /**
   * Получает комментарий к дате для группы
   * 
   * @param groupId ID группы
   * @param date Дата
   * @returns Комментарий или undefined, если не найден
   */
  async getDateComment(groupId: number, date: Date): Promise<DateComment | undefined> {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    const [record] = await db.select()
      .from(dateComments)
      .where(
        and(
          eq(dateComments.groupId, groupId),
          eq(dateComments.date, formattedDate)
        )
      );
    
    return record;
  }
  
  /**
   * Обновляет существующий комментарий к дате
   * 
   * @param id ID комментария
   * @param comment Новый текст комментария
   * @returns Обновленный комментарий
   */
  async updateDateComment(id: number, comment: string): Promise<DateComment> {
    const [updated] = await db.update(dateComments)
      .set({ comment })
      .where(eq(dateComments.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Комментарий с ID ${id} не найден`);
    }
    
    return updated;
  }
  
  /**
   * Удаляет комментарий к дате
   * 
   * @param id ID комментария
   * @returns true, если удаление прошло успешно
   */
  async deleteDateComment(id: number): Promise<boolean> {
    const [deleted] = await db.delete(dateComments)
      .where(eq(dateComments.id, id))
      .returning();
    
    return !!deleted;
  }
}