import { StudentGroup, InsertStudentGroup } from "@shared/schema";

/**
 * Интерфейс хранилища связей студентов и групп
 * Определяет методы для работы с отношениями студент-группа
 */
export interface IStudentGroupStorage {
  /**
   * Получает все связи студент-группа для конкретного студента
   * 
   * @param studentId ID студента
   * @returns Массив связей студент-группа
   */
  getStudentGroups(studentId: number): Promise<StudentGroup[]>;
  
  /**
   * Получает всех студентов в группе (только связи)
   * 
   * @param groupId ID группы
   * @returns Массив связей студент-группа
   */
  getGroupStudents(groupId: number): Promise<StudentGroup[]>;
  
  /**
   * Добавляет студента в группу
   * 
   * @param studentGroup Данные связи студент-группа
   * @returns Созданная связь
   */
  addStudentToGroup(studentGroup: InsertStudentGroup): Promise<StudentGroup>;
  
  /**
   * Удаляет студента из группы
   * 
   * @param studentId ID студента
   * @param groupId ID группы
   */
  removeStudentFromGroup(studentId: number, groupId: number): Promise<void>;
}