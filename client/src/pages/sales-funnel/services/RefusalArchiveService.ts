import { apiRequest } from "@/lib/api";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";

/**
 * Сервис для работы с архивированием отказов
 * Следует принципу единственной ответственности (SRP) из SOLID
 */
export class RefusalArchiveService {
  /**
   * Фильтрует заявки старше указанного количества дней
   * @param requests Список заявок
   * @param days Количество дней
   * @returns Отфильтрованный список заявок
   */
  static filterOldRefusals(requests: ExtendedTrialRequest[], days: number = 5): ExtendedTrialRequest[] {
    if (!requests || !Array.isArray(requests)) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return requests.filter(request => {
      // Проверяем только отказы
      if (request.status !== TrialRequestStatus.REFUSED) return false;
      
      // Проверяем дату обновления
      if (request.updatedAt) {
        const updatedDate = new Date(request.updatedAt);
        return updatedDate < cutoffDate;
      }
      
      return false;
    });
  }
  
  /**
   * Архивирует заявку (скрывает её, но сохраняет в базе данных)
   * Для реализации архивирования мы добавляем специальную метку,
   * но не удаляем заявку из базы данных
   * @param requestId ID заявки
   */
  static async archiveRefusal(requestId: number): Promise<boolean> {
    try {
      const response = await apiRequest(
        "PATCH", 
        `/api/trial-requests/${requestId}/status`,
        {
          status: TrialRequestStatus.REFUSED,
          archived: true,
          notes: `Заявка автоматически архивирована ${new Date().toLocaleDateString()}`
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error('Ошибка при архивировании заявки:', error);
      return false;
    }
  }
  
  /**
   * Архивирует список заявок
   * @param requests Список заявок для архивирования
   * @returns Количество успешно архивированных заявок
   */
  static async archiveBatch(requests: ExtendedTrialRequest[]): Promise<number> {
    if (!requests || !Array.isArray(requests) || requests.length === 0) return 0;
    
    let successCount = 0;
    
    for (const request of requests) {
      const success = await this.archiveRefusal(request.id);
      if (success) successCount++;
    }
    
    return successCount;
  }
}