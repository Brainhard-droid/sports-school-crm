import { Student, InsertStudent } from "@shared/schema";

/**
 * Интерфейс для хранилища студентов
 */
export interface IStudentStorage {
  /**
   * Получает всех студентов
   * 
   * @param active Если true, возвращает только активных студентов
   * @returns Массив студентов
   */
  getAllStudents(active?: boolean): Promise<Student[]>;
  
  /**
   * Получает студента по ID
   * 
   * @param id ID студента
   * @returns Студент или undefined, если не найден
   */
  getStudentById(id: number): Promise<Student | undefined>;
  
  /**
   * Создает нового студента
   * 
   * @param data Данные для создания студента
   * @returns Созданный студент
   */
  createStudent(data: InsertStudent): Promise<Student>;
  
  /**
   * Обновляет студента
   * 
   * @param id ID студента
   * @param data Данные для обновления
   * @returns Обновленный студент
   */
  updateStudent(id: number, data: Partial<InsertStudent>): Promise<Student>;
  
  /**
   * Удаляет студента (помечает как неактивного)
   * 
   * @param id ID студента
   * @returns true, если успешно удален
   */
  deleteStudent(id: number): Promise<boolean>;
}