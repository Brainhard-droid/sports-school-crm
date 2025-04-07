import { StudentGroup, InsertStudentGroup, studentGroups } from "@shared/schema";
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { IStudentGroupStorage } from "../interfaces/storage/IStudentGroupStorage";

/**
 * Реализация хранилища связей студентов и групп
 */
export class StudentGroupStorage implements IStudentGroupStorage {
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
}