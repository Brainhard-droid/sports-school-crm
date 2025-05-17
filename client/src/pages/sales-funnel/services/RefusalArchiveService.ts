import { apiRequest, getResponseData } from "@/lib/api";
import { ExtendedTrialRequest } from "@shared/schema";

// Константы для маркеров архивирования (соблюдаем Open/Closed принцип SOLID)
export const ARCHIVE_MARKERS = {
  ARCHIVED: "архивирована",
  ARCHIVE_PREFIX: "[Заявка автоматически архивирована",
  RESTORE_PREFIX: "[Восстановлена из архива"
};

/**
 * Сервис для работы с архивированием отказов
 * Следует принципу единственной ответственности (SRP) из SOLID
 */
export class RefusalArchiveService {
  /**
   * Проверяет, является ли заявка архивированной
   * @param request Заявка для проверки
   * @returns true, если заявка архивирована
   */
  static isArchived(request: ExtendedTrialRequest): boolean {
    return !!(request.notes && request.notes.includes(ARCHIVE_MARKERS.ARCHIVED));
  }
  
  /**
   * Проверяет, была ли заявка восстановлена из архива
   * @param request Заявка для проверки
   * @returns true, если заявка была восстановлена
   */
  static isRestored(request: ExtendedTrialRequest): boolean {
    return !!(request.notes && request.notes.includes(ARCHIVE_MARKERS.RESTORE_PREFIX));
  }
  
  /**
   * Формирует метку архивирования для заявки
   * @returns Строка метки архивирования с текущей датой
   */
  static getArchiveMarker(): string {
    const currentDate = new Date().toLocaleDateString();
    return `${ARCHIVE_MARKERS.ARCHIVE_PREFIX} ${currentDate}]`;
  }
  
  /**
   * Формирует метку восстановления из архива
   * @returns Строка метки восстановления с текущей датой
   */
  static getRestoreMarker(): string {
    const currentDate = new Date().toLocaleDateString();
    return `${ARCHIVE_MARKERS.RESTORE_PREFIX} ${currentDate}]`;
  }
  
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
      // Получаем метку архивирования с текущей датой
      const archiveNote = this.getArchiveMarker();
      
      // Сохраняем старые примечания, если они есть
      const notes = oldNotes ? `${oldNotes} ${archiveNote}` : archiveNote;
      
      // Отправляем запрос на обновление примечаний заявки
      await apiRequest("PATCH", `/api/trial-requests/${requestId}`, { notes });
      
      // Добавляем задержку для гарантии сохранения данных перед обновлением UI
      await new Promise(resolve => setTimeout(resolve, 300));
      
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
      const request = await getResponseData<ExtendedTrialRequest>(response);
      
      if (!request) {
        return false;
      }
      
      // Удаляем метку архивирования из примечаний
      let notes = request.notes || '';
      
      // Удаляем все метки архивирования
      notes = notes.replace(new RegExp(`${ARCHIVE_MARKERS.ARCHIVE_PREFIX}[^\\]]*\\]`, 'g'), '')
        .trim();
      
      // Добавляем метку восстановления
      notes = `${notes} ${this.getRestoreMarker()}`.trim();
      
      // Отправляем запрос на обновление примечаний заявки
      await apiRequest("PATCH", `/api/trial-requests/${requestId}`, { notes });
      
      // Добавляем задержку для гарантии сохранения данных перед обновлением UI
      await new Promise(resolve => setTimeout(resolve, 300));
      
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