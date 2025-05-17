import { apiRequest, getResponseData } from "@/lib/api";
import { ExtendedTrialRequest } from "@shared/schema";

/**
 * Константы для маркеров архивирования
 * Следует принципу Open/Closed (OCP) из SOLID:
 * - открыт для расширения (можно добавить новые теги)
 * - закрыт для модификации (существующие теги не меняются)
 */
export const ARCHIVE_MARKERS = {
  // Уникальный маркер для архивирования - гарантирует точную идентификацию
  ARCHIVE_TAG: "___ARCHIVED_REFUSAL___",
  
  // Маркер восстановления из архива
  RESTORE_TAG: "___RESTORED_REFUSAL___",
  
  // Текстовые метки для пользовательского интерфейса
  ARCHIVE_LABEL: "Архивирована",
  RESTORE_LABEL: "Восстановлена",
  
  // Маркеры для сообщений в примечаниях
  ARCHIVE_MESSAGE: "Заявка архивирована",
  RESTORE_MESSAGE: "Восстановлена из архива"
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
    // Используем стабильный тег для точной идентификации
    return !!(request.notes && request.notes.includes(ARCHIVE_MARKERS.ARCHIVE_TAG));
  }
  
  /**
   * Проверяет, была ли заявка восстановлена из архива
   * @param request Заявка для проверки
   * @returns true, если заявка восстановлена
   */
  static isRestored(request: ExtendedTrialRequest): boolean {
    // Заявка восстановлена, если содержит тег восстановления, но не помечена архивированной
    return !!(
      request.notes && 
      request.notes.includes(ARCHIVE_MARKERS.RESTORE_TAG) && 
      !this.isArchived(request)
    );
  }
  
  /**
   * Формирует метку архивирования для примечаний
   * @returns Строка с меткой архивирования
   */
  static getArchiveMarker(): string {
    const date = new Date().toLocaleDateString();
    return `[${ARCHIVE_MARKERS.ARCHIVE_MESSAGE} ${date}] [${ARCHIVE_MARKERS.ARCHIVE_TAG}]`;
  }
  
  /**
   * Формирует метку восстановления для примечаний
   * @returns Строка с меткой восстановления
   */
  static getRestoreMarker(): string {
    const date = new Date().toLocaleDateString();
    return `[${ARCHIVE_MARKERS.RESTORE_MESSAGE} ${date}] [${ARCHIVE_MARKERS.RESTORE_TAG}]`;
  }
  
  /**
   * Архивирует заявку на отказ
   * @param requestId ID заявки для архивирования
   * @param oldNotes Предыдущие примечания (если есть)
   * @returns Promise<boolean> Результат операции
   */
  static async archiveRefusal(requestId: number, oldNotes?: string): Promise<boolean> {
    try {
      console.log(`RefusalArchiveService: Архивирование заявки ID=${requestId}`);
      
      // Проверяем, архивирована ли уже заявка
      if (oldNotes && oldNotes.includes(ARCHIVE_MARKERS.ARCHIVE_TAG)) {
        console.log('Заявка уже содержит тег архивирования');
        return true;
      }
      
      // Создаем текст примечаний с маркером архивирования
      const archiveMarker = this.getArchiveMarker();
      const notes = oldNotes 
        ? `${oldNotes.trim()} ${archiveMarker}`
        : archiveMarker;
      
      console.log('Архивирование с примечаниями:', notes);
      
      // ВАЖНО: отправляем запрос к API с флагом archived: true
      // Это сообщает бэкенду, что заявка должна быть архивирована
      const response = await apiRequest(
        "PATCH",
        `/api/trial-requests/${requestId}/status`,
        { 
          notes,
          archived: true // Ключевое изменение: отмечаем заявку как архивированную
        }
      );
      
      // Проверяем успешность запроса
      const success = response.ok;
      
      if (success) {
        console.log('Заявка успешно архивирована');
      } else {
        console.error('Ошибка при архивировании:', await response.text());
      }
      
      return success;
    } catch (error) {
      console.error('Ошибка при архивировании заявки:', error);
      return false;
    }
  }
  
  /**
   * Восстанавливает заявку из архива
   * @param requestId ID заявки для восстановления
   * @returns Promise<boolean> Результат операции
   */
  static async restoreFromArchive(requestId: number): Promise<boolean> {
    try {
      console.log(`RefusalArchiveService: Восстановление заявки ID=${requestId}`);
      
      // Получаем текущие данные заявки
      const response = await apiRequest("GET", `/api/trial-requests/${requestId}`);
      if (!response.ok) {
        console.error('Не удалось получить данные заявки:', await response.text());
        return false;
      }
      
      const request = await getResponseData<ExtendedTrialRequest>(response);
      
      // Подготавливаем текст примечаний без маркера архивирования
      let notes = request.notes || '';
      
      // Удаляем все маркеры архивирования
      notes = notes
        .replace(new RegExp(`\\[${ARCHIVE_MARKERS.ARCHIVE_MESSAGE}[^\\]]*\\]`, 'g'), '')
        .replace(new RegExp(`\\[${ARCHIVE_MARKERS.ARCHIVE_TAG}\\]`, 'g'), '')
        .replace(/\[Заявка автоматически архивирована[^\]]*\]/g, '') // Удаляем метки автоматического архивирования
        .trim();
      
      // Добавляем маркер восстановления
      const restoreMarker = this.getRestoreMarker();
      notes = `${notes} ${restoreMarker}`.trim();
      
      console.log('Восстановление с примечаниями:', notes);
      
      // Отправляем запрос к API для обновления заявки через маршрут status
      // Важно: используем тот же маршрут, что и для архивирования,
      // но без параметра archived
      const updateResponse = await apiRequest(
        "PATCH",
        `/api/trial-requests/${requestId}/status`,
        { notes }
      );
      
      // Проверяем успешность запроса
      const success = updateResponse.ok;
      
      if (success) {
        console.log('Заявка успешно восстановлена из архива');
      } else {
        console.error('Ошибка при восстановлении:', await updateResponse.text());
      }
      
      return success;
    } catch (error) {
      console.error('Ошибка при восстановлении заявки из архива:', error);
      return false;
    }
  }
  
  /**
   * Архивирует сразу несколько заявок
   * @param requests Список заявок для архивирования
   * @returns Promise<number> Количество успешно архивированных заявок
   */
  static async archiveBatch(requests: ExtendedTrialRequest[]): Promise<number> {
    let successCount = 0;
    
    for (const request of requests) {
      const success = await this.archiveRefusal(request.id, request.notes || undefined);
      if (success) {
        successCount++;
      }
    }
    
    return successCount;
  }
  
  /**
   * Фильтрует заявки старше указанного количества дней
   * Следует принципу Interface Segregation (ISP) из SOLID
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
}