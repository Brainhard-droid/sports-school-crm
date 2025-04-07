import { StudentGroup, InsertStudentGroup, studentGroups } from "@shared/schema";
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { IStudentGroupStorage } from "../interfaces/storage/IStudentGroupStorage";

// Расширяем интерфейс для новых методов
export interface IExtendedStudentGroupStorage extends IStudentGroupStorage {
  getStudentGroupByIds(studentId: number, groupId: number): Promise<StudentGroup | undefined>;
  createStudentGroup(data: InsertStudentGroup): Promise<StudentGroup>;
  updateStudentGroup(id: number, data: Partial<InsertStudentGroup>): Promise<StudentGroup>;
}

/**
 * Реализация хранилища связей студентов и групп
 */
export class StudentGroupStorage implements IExtendedStudentGroupStorage {
  /**
   * Получает все связи студент-группа для конкретного студента
   * 
   * @param studentId ID студента
   * @returns Массив связей студент-группа
   */
  async getStudentGroups(studentId: number): Promise<StudentGroup[]> {
    try {
      return await db
        .select()
        .from(studentGroups)
        .where(eq(studentGroups.studentId, studentId));
    } catch (error) {
      console.error('Error getting student groups:', error);
      throw error;
    }
  }
  
  /**
   * Получает всех студентов в группе (только связи)
   * 
   * @param groupId ID группы
   * @returns Массив связей студент-группа
   */
  async getGroupStudents(groupId: number): Promise<StudentGroup[]> {
    try {
      return await db
        .select()
        .from(studentGroups)
        .where(eq(studentGroups.groupId, groupId));
    } catch (error) {
      console.error('Error getting group students:', error);
      throw error;
    }
  }
  
  /**
   * Добавляет студента в группу
   * 
   * @param studentGroup Данные связи студент-группа
   * @returns Созданная связь
   */
  async addStudentToGroup(studentGroup: InsertStudentGroup): Promise<StudentGroup> {
    try {
      const [newStudentGroup] = await db
        .insert(studentGroups)
        .values(studentGroup)
        .returning();
      
      return newStudentGroup;
    } catch (error) {
      console.error('Error adding student to group:', error);
      throw error;
    }
  }
  
  /**
   * Удаляет студента из группы
   * 
   * @param studentId ID студента
   * @param groupId ID группы
   */
  async removeStudentFromGroup(studentId: number, groupId: number): Promise<void> {
    try {
      await db
        .delete(studentGroups)
        .where(
          and(
            eq(studentGroups.studentId, studentId),
            eq(studentGroups.groupId, groupId)
          )
        );
    } catch (error) {
      console.error('Error removing student from group:', error);
      throw error;
    }
  }
  
  /**
   * Получает связь студент-группа по ID студента и группы
   * 
   * @param studentId ID студента
   * @param groupId ID группы
   * @returns Связь студент-группа или undefined, если не найдена
   */
  async getStudentGroupByIds(studentId: number, groupId: number): Promise<StudentGroup | undefined> {
    try {
      const [studentGroup] = await db
        .select()
        .from(studentGroups)
        .where(
          and(
            eq(studentGroups.studentId, studentId),
            eq(studentGroups.groupId, groupId)
          )
        );
      
      return studentGroup;
    } catch (error) {
      console.error('Error getting student-group by IDs:', error);
      throw error;
    }
  }
  
  /**
   * Создает новую связь студент-группа
   * 
   * @param data Данные для создания связи
   * @returns Созданная связь
   */
  async createStudentGroup(data: InsertStudentGroup): Promise<StudentGroup> {
    try {
      const [newStudentGroup] = await db
        .insert(studentGroups)
        .values(data)
        .returning();
      
      return newStudentGroup;
    } catch (error) {
      console.error('Error creating student-group:', error);
      throw error;
    }
  }
  
  /**
   * Обновляет связь студент-группа
   * 
   * @param id ID связи студент-группа
   * @param data Данные для обновления
   * @returns Обновленная связь
   */
  async updateStudentGroup(id: number, data: Partial<InsertStudentGroup>): Promise<StudentGroup> {
    try {
      const [updatedStudentGroup] = await db
        .update(studentGroups)
        .set(data)
        .where(eq(studentGroups.id, id))
        .returning();
      
      if (!updatedStudentGroup) {
        throw new Error(`StudentGroup with id ${id} not found`);
      }
      
      return updatedStudentGroup;
    } catch (error) {
      console.error('Error updating student-group:', error);
      throw error;
    }
  }
}