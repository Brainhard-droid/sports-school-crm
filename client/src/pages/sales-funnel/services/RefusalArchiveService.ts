import { apiRequest, getResponseData } from "@/lib/api";
import { ExtendedTrialRequest } from "@shared/schema";

// Константы для маркеров архивирования (соблюдаем Open/Closed принцип SOLID)
export const ARCHIVE_MARKERS = {
  // Строгий формат маркера архивирования - всегда один и тот же
  ARCHIVE_TAG: "ARCHIVED_REFUSAL",
  ARCHIVED: "Архивирована:",  // Текст, который отображается пользователю
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
   * Использует специальный тег ARCHIVE_TAG для безошибочного определения
   * @param request Заявка для проверки
   * @returns true, если заявка архивирована
   */
  static isArchived(request: ExtendedTrialRequest): boolean {
    return !!(
      request.notes && 
      (request.notes.includes(ARCHIVE_MARKERS.ARCHIVE_TAG) || 
       request.notes.includes(ARCHIVE_MARKERS.ARCHIVED))
    );
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
    // Добавляем уникальный тег ARCHIVE_TAG для надежной идентификации
    return `${ARCHIVE_MARKERS.ARCHIVE_PREFIX} ${currentDate}] [${ARCHIVE_MARKERS.ARCHIVE_TAG}]`;
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
  /**
   * Архивирует заявку, добавляя специальный маркер в примечания
   * Метод гарантирует идемпотентность (можно вызывать многократно)
   * @param requestId ID заявки для архивирования
   * @param oldNotes Предыдущие примечания заявки (если есть)
   * @returns Promise<boolean> - результат операции
   */
  static async archiveRefusal(requestId: number, oldNotes?: string): Promise<boolean> {
    try {
      // Если заявка уже содержит тег архивирования, не добавляем его снова
      if (oldNotes && oldNotes.includes(ARCHIVE_MARKERS.ARCHIVE_TAG)) {
        console.log('Заявка уже архивирована, пропускаем архивирование');
        return true;
      }
      
      // Получаем метку архивирования с текущей датой
      const archiveNote = this.getArchiveMarker();
      
      // Сохраняем старые примечания, если они есть
      const notes = oldNotes ? `${oldNotes} ${archiveNote}` : archiveNote;
      
      console.log('Архивирование заявки с ID:', requestId);
      console.log('Новые примечания:', notes);
      
      // Отправляем запрос на обновление примечаний заявки
      const response = await apiRequest("PATCH", `/api/trial-requests/${requestId}`, { notes });
      
      // Добавляем задержку для гарантии сохранения данных перед обновлением UI
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Проверяем успешность запроса
      if (response.ok) {
        console.log('Заявка успешно архивирована');
        return true;
      } else {
        console.error('Ошибка при архивировании заявки, статус:', response.status);
        return false;
      }
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
  /**
   * Восстанавливает заявку из архива, убирая маркер архивирования
   * @param requestId ID заявки для восстановления
   * @returns Promise<boolean> - результат операции
   */
  static async restoreFromArchive(requestId: number): Promise<boolean> {
    try {
      console.log('Восстановление заявки с ID:', requestId);
      
      // Получаем текущую заявку
      const response = await apiRequest("GET", `/api/trial-requests/${requestId}`);
      const request = await getResponseData<ExtendedTrialRequest>(response);
      
      if (!request) {
        console.error('Не удалось получить заявку для восстановления');
        return false;
      }
      
      // Удаляем метку архивирования из примечаний
      let notes = request.notes || '';
      
      console.log('Исходные примечания:', notes);
      
      // Удаляем все метки архивирования и теги
      notes = notes
        // Удаляем префикс архивирования
        .replace(new RegExp(`${ARCHIVE_MARKERS.ARCHIVE_PREFIX}[^\\]]*\\]`, 'g'), '')
        // Удаляем тег архивирования
        .replace(new RegExp(`\\[${ARCHIVE_MARKERS.ARCHIVE_TAG}\\]`, 'g'), '')
        .trim();
      
      // Добавляем метку восстановления
      const restoreMarker = this.getRestoreMarker();
      notes = `${notes} ${restoreMarker}`.trim();
      
      console.log('Новые примечания после восстановления:', notes);
      
      // Отправляем запрос на обновление примечаний заявки
      const updateResponse = await apiRequest("PATCH", `/api/trial-requests/${requestId}`, { notes });
      
      // Добавляем задержку для гарантии сохранения данных перед обновлением UI
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Проверяем успешность запроса
      if (updateResponse.ok) {
        console.log('Заявка успешно восстановлена из архива');
        return true;
      } else {
        console.error('Ошибка при восстановлении заявки, статус:', updateResponse.status);
        return false;
      }
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