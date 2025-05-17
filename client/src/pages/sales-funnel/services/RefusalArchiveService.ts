import { apiRequest, getResponseData } from "@/lib/api";
import { ExtendedTrialRequest } from "@shared/schema";

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
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - days));
    
    return requests.filter(request => {
      // Используем дату обновления как более актуальную для отслеживания активности по заявке
      const requestDate = new Date(request.updatedAt || request.createdAt || Date.now());
      return requestDate < cutoffDate;
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
      // Формируем обновленные примечания с меткой об архивировании
      const currentDate = new Date().toLocaleDateString();
      const archiveNote = `[Заявка автоматически архивирована ${currentDate}]`;
      
      // Сохраняем старые примечания, если они есть
      const notes = oldNotes ? `${oldNotes} ${archiveNote}` : archiveNote;
      
      // Отправляем запрос на обновление примечаний заявки
      await apiRequest("PATCH", `/api/trial-requests/${requestId}`, { notes });
      
      return true;
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
      // Получаем текущую заявку
      const response = await apiRequest("GET", `/api/trial-requests/${requestId}`);
      const request = await getResponseData(response);
      
      if (!request) {
        return false;
      }
      
      // Удаляем метку архивирования из примечаний
      let notes = request.notes || '';
      notes = notes.replace(/\[Заявка автоматически архивирована[^\]]*\]/g, '')
        .trim() + ` [Восстановлена из архива ${new Date().toLocaleDateString()}]`;
      
      // Отправляем запрос на обновление примечаний заявки
      await apiRequest("PATCH", `/api/trial-requests/${requestId}`, { notes });
      
      return true;
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
    let archivedCount = 0;
    
    // Архивируем каждую заявку из списка
    for (const request of requests) {
      const success = await this.archiveRefusal(request.id, request.notes || undefined);
      if (success) {
        archivedCount++;
      }
    }
    
    return archivedCount;
  }
}