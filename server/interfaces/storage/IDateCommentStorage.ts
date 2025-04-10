import { DateComment, InsertDateComment } from "@shared/schema";

/**
 * Интерфейс для хранилища комментариев к датам
 */
export interface IDateCommentStorage {
  /**
   * Получает комментарии к датам для группы за указанный месяц
   * 
   * @param groupId ID группы
   * @param month Месяц (1-12)
   * @param year Год
   * @returns Массив комментариев к датам
   */
  getDateComments(groupId: number, month: number, year: number): Promise<DateComment[]>;
  
  /**
   * Создает новый комментарий к дате
   * 
   * @param comment Данные для создания комментария
   * @returns Созданный комментарий
   */
  createDateComment(comment: InsertDateComment): Promise<DateComment>;
  
  /**
   * Получает комментарий к дате по ID
   * 
   * @param id ID комментария
   * @returns Комментарий к дате или undefined, если комментарий не найден
   */
  getDateCommentById(id: number): Promise<DateComment | undefined>;
  
  /**
   * Получает комментарий к дате для группы
   * 
   * @param groupId ID группы
   * @param date Дата
   * @returns Комментарий или undefined, если не найден
   */
  getDateComment(groupId: number, date: Date): Promise<DateComment | undefined>;
  
  /**
   * Обновляет существующий комментарий к дате
   * 
   * @param id ID комментария
   * @param comment Новый текст комментария
   * @returns Обновленный комментарий
   */
  updateDateComment(id: number, comment: string): Promise<DateComment>;
  
  /**
   * Удаляет комментарий к дате
   * 
   * @param id ID комментария
   * @returns true, если удаление прошло успешно
   */
  deleteDateComment(id: number): Promise<boolean>;
}