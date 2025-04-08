import { Group, InsertGroup, Student, groups } from "@shared/schema";
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { IGroupStorage } from "../interfaces/storage/IGroupStorage";

/**
 * Реализация хранилища групп
 */
export class GroupStorage implements IGroupStorage {
  /**
   * Получает все группы
   * 
   * @returns Массив групп
   */
  async getGroups(): Promise<Group[]> {
    try {
      return await db.select().from(groups);
    } catch (error) {
      console.error('Error getting all groups:', error);
      throw error;
    }
  }
  
  /**
   * Получает группу по ID
   * 
   * @param id ID группы
   * @returns Группа или undefined, если не найдена
   */
  async getGroup(id: number): Promise<Group | undefined> {
    try {
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, id));
      
      return group;
    } catch (error) {
      console.error('Error getting group by ID:', error);
      throw error;
    }
  }
  
  /**
   * Создает новую группу
   * 
   * @param group Данные для создания группы
   * @returns Созданная группа
   */
  async createGroup(group: InsertGroup): Promise<Group> {
    try {
      const [newGroup] = await db
        .insert(groups)
        .values(group)
        .returning();
      
      return newGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }
  
  /**
   * Получает список студентов в группе с подробными данными
   * 
   * @param groupId ID группы
   * @returns Массив студентов
   */
  async getGroupStudentsWithDetails(groupId: number): Promise<Student[]> {
    try {
      const { students, studentGroups } = await import('@shared/schema');
      
      // Делаем JOIN между таблицами students и student_groups
      const result = await db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          birthDate: students.birthDate,
          parentName: students.parentName,
          parentPhone: students.parentPhone,
          secondParentName: students.secondParentName,
          secondParentPhone: students.secondParentPhone,
          active: students.active,
          studentGroupId: studentGroups.id,
          joinDate: studentGroups.joinDate,
          groupActive: studentGroups.active,
        })
        .from(studentGroups)
        .innerJoin(students, eq(studentGroups.studentId, students.id))
        .where(
          and(
            eq(studentGroups.groupId, groupId),
            eq(studentGroups.active, true),
            eq(students.active, true)
          )
        );
      
      console.log(`Found ${result.length} students in group ${groupId}`);
      
      return result.map(row => ({
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        birthDate: row.birthDate,
        parentName: row.parentName,
        parentPhone: row.parentPhone,
        secondParentName: row.secondParentName,
        secondParentPhone: row.secondParentPhone,
        active: row.active,
      }));
    } catch (error) {
      console.error('Error getting group students with details:', error);
      throw error;
    }
  }
  
  /**
   * Удаляет группу
   * 
   * @param id ID группы
   */
  async deleteGroup(id: number): Promise<void> {
    try {
      await db
        .delete(groups)
        .where(eq(groups.id, id));
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }
}