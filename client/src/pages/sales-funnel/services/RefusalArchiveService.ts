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
      
      // Проверяем, что заявка не архивирована
      if (request.notes && request.notes.includes('архивирована')) return false;
      
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
   * Для реализации архивирования мы добавляем специальную метку в примечания,
   * но не удаляем заявку из базы данных
   * @param requestId ID заявки
   * @param oldNotes Старые примечания заявки
   */
  static async archiveRefusal(requestId: number, oldNotes?: string): Promise<boolean> {
    try {
      // Формируем новые примечания, добавляя метку архивирования
      const archiveNote = `Заявка автоматически архивирована ${new Date().toLocaleDateString()}`;
      
      // Если есть старые примечания, сохраняем их
      const notes = oldNotes 
        ? `${oldNotes} [${archiveNote}]`
        : archiveNote;
        
      console.log(`Архивирование заявки #${requestId} с примечанием: ${notes}`);
      
      const response = await apiRequest(
        "PATCH", 
        `/api/trial-requests/${requestId}/status`,
        {
          status: TrialRequestStatus.REFUSED,
          notes: notes,
          archived: true
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error('Ошибка при архивировании заявки:', error);
      return false;
    }
  }
  
  /**
   * Восстанавливает заявку из архива
   * @param requestId ID заявки
   * @returns True, если восстановление успешно
   */
  static async restoreFromArchive(requestId: number): Promise<boolean> {
    try {
      console.log(`Восстановление заявки #${requestId} из архива`);
      
      // Получаем текущую заявку
      const response = await apiRequest("GET", `/api/trial-requests/${requestId}`);
      
      if (!response.ok) {
        throw new Error('Не удалось получить заявку');
      }
      
      const request = await response.json();
      
      // Удаляем метку архивирования из примечаний
      let notes = request.notes || '';
      notes = notes.replace(/\[Заявка автоматически архивирована[^\]]*\]/g, '').trim();
      
      // Если примечания были, добавляем метку восстановления
      if (notes) {
        notes += ` [Восстановлена из архива ${new Date().toLocaleDateString()}]`;
      } else {
        notes = `Восстановлена из архива ${new Date().toLocaleDateString()}`;
      }
      
      // Обновляем заявку
      const updateResponse = await apiRequest(
        "PATCH", 
        `/api/trial-requests/${requestId}/status`,
        {
          status: TrialRequestStatus.REFUSED,
          notes: notes,
          archived: false
        }
      );
      
      return updateResponse.ok;
    } catch (error) {
      console.error('Ошибка при восстановлении заявки из архива:', error);
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
      // Передаем существующие примечания, чтобы сохранить информацию о причинах отказа
      const success = await this.archiveRefusal(request.id, request.notes || undefined);
      if (success) successCount++;
    }
    
    return successCount;
  }
}