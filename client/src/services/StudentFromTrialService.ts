import { apiRequest } from "@/lib/api";
import { ExtendedTrialRequest, InsertStudent } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

/**
 * Сервис для автоматического создания ученика из заявки на пробное занятие
 * Следует принципу единственной ответственности (SRP) из SOLID
 */
export class StudentFromTrialService {
  /**
   * Создает нового ученика на основе данных заявки на пробное занятие
   * @param trialRequest Заявка на пробное занятие
   * @returns Promise с созданным учеником
   */
  static async createStudentFromTrialRequest(trialRequest: ExtendedTrialRequest): Promise<any> {
    try {
      console.log(`Создание ученика из заявки ID=${trialRequest.id}`);

      // Формируем данные ученика из данных заявки
      const studentData: InsertStudent = {
        firstName: this.extractFirstName(trialRequest.childName),
        lastName: this.extractLastName(trialRequest.childName),
        birthDate: this.calculateBirthDateFromAge(trialRequest.childAge),
        parentName: trialRequest.parentName,
        parentPhone: trialRequest.parentPhone,
        secondParentName: null,
        secondParentPhone: null,
        active: true
      };

      console.log("Подготовленные данные для создания ученика:", studentData);

      // Отправляем запрос на создание ученика
      const response = await apiRequest("POST", "/api/students", studentData);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка при создании ученика: ${errorText}`);
      }

      const createdStudent = await response.json();
      
      // Обновляем кэш списка учеников
      this.invalidateStudentsCache();
      
      return createdStudent;
    } catch (error) {
      console.error("Ошибка при создании ученика из заявки:", error);
      throw error;
    }
  }

  /**
   * Извлекает имя из полного имени ребенка
   * @param fullName Полное имя ребенка
   * @returns Имя
   */
  private static extractFirstName(fullName: string): string {
    // Предполагаем, что имя - это первое слово
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || fullName; // Если разделение не удалось, возвращаем всё имя
  }

  /**
   * Извлекает фамилию из полного имени ребенка
   * @param fullName Полное имя ребенка
   * @returns Фамилия
   */
  private static extractLastName(fullName: string): string {
    // Предполагаем, что фамилия - это второе слово
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(" ") : ""; // Остальные слова идут как фамилия
  }

  /**
   * Рассчитывает примерную дату рождения на основе возраста
   * @param age Возраст в годах
   * @returns Дата рождения в формате YYYY-MM-DD
   */
  private static calculateBirthDateFromAge(age: number): string {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    const birthDate = new Date(birthYear, today.getMonth(), today.getDate());
    
    // Форматируем дату в формат YYYY-MM-DD
    return birthDate.toISOString().split('T')[0];
  }

  /**
   * Обновляет кэш списка учеников
   */
  private static invalidateStudentsCache(): void {
    queryClient.invalidateQueries({ queryKey: ['/api/students'] });
  }
}