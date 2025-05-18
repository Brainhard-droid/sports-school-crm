import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { InsertUser, User, UserGroup, userGroups, users, groups, Group } from '@shared/schema';
import { BaseStorage } from './BaseStorage';

/**
 * Класс для хранения и управления связями пользователей с группами
 * Следует принципу единственной ответственности (SRP) из SOLID
 */
export class UserGroupStorage extends BaseStorage {
  /**
   * Получает все связи пользователей с группами
   * @returns Список всех связей
   */
  async getAllUserGroups(): Promise<UserGroup[]> {
    return await db.select().from(userGroups);
  }

  /**
   * Получает все группы, к которым пользователь имеет доступ
   * @param userId ID пользователя
   * @returns Список групп
   */
  async getGroupsByUserId(userId: number): Promise<Group[]> {
    // Получаем ID групп, к которым у пользователя есть доступ
    const userGroupRelations = await db
      .select()
      .from(userGroups)
      .where(eq(userGroups.userId, userId));
    
    if (userGroupRelations.length === 0) {
      return [];
    }
    
    // Получаем данные групп по их ID
    const groupIds = userGroupRelations.map(relation => relation.groupId);
    const groupsData = await Promise.all(
      groupIds.map(async (groupId) => {
        const [group] = await db
          .select()
          .from(groups)
          .where(eq(groups.id, groupId));
        return group;
      })
    );
    
    // Фильтруем undefined значения
    return groupsData.filter(Boolean) as Group[];
  }

  /**
   * Получает группы, где пользователь является тренером
   * @param trainerId ID пользователя-тренера
   * @returns Список групп
   */
  async getGroupsByTrainerId(trainerId: number): Promise<Group[]> {
    return await db
      .select()
      .from(groups)
      .where(eq(groups.trainer, trainerId));
  }

  /**
   * Получает группы, к которым относится студент
   * @param studentId ID студента
   * @returns Список групп
   */
  async getGroupsByStudentId(studentId: number): Promise<Group[]> {
    // Получаем связи студента с группами
    const studentGroups = await db
      .select()
      .from(db.schema.studentGroups)
      .where(eq(db.schema.studentGroups.studentId, studentId));
    
    if (studentGroups.length === 0) {
      return [];
    }
    
    // Получаем данные групп по их ID
    const groupIds = studentGroups.map(relation => relation.groupId);
    const groupsData = await Promise.all(
      groupIds.map(async (groupId) => {
        const [group] = await db
          .select()
          .from(groups)
          .where(eq(groups.id, groupId));
        return group;
      })
    );
    
    // Фильтруем undefined значения
    return groupsData.filter(Boolean) as Group[];
  }

  /**
   * Назначает пользователю доступ к группе
   * @param userId ID пользователя
   * @param groupId ID группы
   * @returns Созданная связь
   */
  async assignGroupToUser(userId: number, groupId: number): Promise<UserGroup> {
    // Проверяем, существует ли уже такая связь
    const existingRelation = await db
      .select()
      .from(userGroups)
      .where(
        and(
          eq(userGroups.userId, userId),
          eq(userGroups.groupId, groupId)
        )
      );
    
    if (existingRelation.length > 0) {
      return existingRelation[0];
    }
    
    // Создаем новую связь
    const [newRelation] = await db
      .insert(userGroups)
      .values({
        userId,
        groupId
      })
      .returning();
    
    return newRelation;
  }

  /**
   * Отзывает у пользователя доступ к группе
   * @param userId ID пользователя
   * @param groupId ID группы
   * @returns true, если связь была удалена
   */
  async removeGroupFromUser(userId: number, groupId: number): Promise<boolean> {
    const result = await db
      .delete(userGroups)
      .where(
        and(
          eq(userGroups.userId, userId),
          eq(userGroups.groupId, groupId)
        )
      )
      .returning();
    
    return result.length > 0;
  }

  /**
   * Получает пользователей с доступом к группе
   * @param groupId ID группы
   * @returns Список пользователей
   */
  async getUsersByGroupId(groupId: number): Promise<User[]> {
    // Получаем ID пользователей, у которых есть доступ к этой группе
    const userGroupRelations = await db
      .select()
      .from(userGroups)
      .where(eq(userGroups.groupId, groupId));
    
    if (userGroupRelations.length === 0) {
      return [];
    }
    
    // Получаем данные пользователей по их ID
    const userIds = userGroupRelations.map(relation => relation.userId);
    const usersData = await Promise.all(
      userIds.map(async (userId) => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
        return user;
      })
    );
    
    // Фильтруем undefined значения
    return usersData.filter(Boolean) as User[];
  }
}