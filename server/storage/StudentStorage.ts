import { Student, InsertStudent, students } from "@shared/schema";
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { IStudentStorage } from "../interfaces/storage";

/**
 * Реализация хранилища студентов
 */
export class StudentStorage implements IStudentStorage {
  /**
   * Получает всех студентов
   * 
   * @param active Если true, возвращает только активных студентов
   * @returns Массив студентов
   */
  async getAllStudents(active?: boolean): Promise<Student[]> {
    try {
      let query = db.select().from(students);
      
      if (active !== undefined) {
        query = query.where(eq(students.active, active));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting all students:', error);
      throw error;
    }
  }
  
  /**
   * Получает студента по ID
   * 
   * @param id ID студента
   * @returns Студент или undefined, если не найден
   */
  async getStudentById(id: number): Promise<Student | undefined> {
    try {
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, id));
      
      return student;
    } catch (error) {
      console.error('Error getting student by ID:', error);
      throw error;
    }
  }
  
  /**
   * Создает нового студента
   * 
   * @param data Данные для создания студента
   * @returns Созданный студент
   */
  async createStudent(data: InsertStudent): Promise<Student> {
    try {
      const [student] = await db
        .insert(students)
        .values(data)
        .returning();
      
      return student;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }
  
  /**
   * Обновляет студента
   * 
   * @param id ID студента
   * @param data Данные для обновления
   * @returns Обновленный студент
   */
  async updateStudent(id: number, data: Partial<InsertStudent>): Promise<Student> {
    try {
      const [student] = await db
        .update(students)
        .set(data)
        .where(eq(students.id, id))
        .returning();
      
      return student;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }
  
  /**
   * Удаляет студента (помечает как неактивного)
   * 
   * @param id ID студента
   * @returns true, если успешно удален
   */
  async deleteStudent(id: number): Promise<boolean> {
    try {
      const [student] = await db
        .update(students)
        .set({ active: false })
        .where(eq(students.id, id))
        .returning();
      
      return !!student;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }
}