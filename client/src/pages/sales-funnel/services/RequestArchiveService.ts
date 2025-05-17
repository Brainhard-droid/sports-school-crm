import { apiRequest, getResponseData } from "@/lib/api";
import { ExtendedTrialRequest } from "@shared/schema";

/**
 * Константы для маркеров архивирования
 * Следует принципу Open/Closed (OCP) из SOLID:
 * - открыт для расширения (можно добавить новые теги)
 * - закрыт для модификации (существующие теги не меняются)
 */
export const ARCHIVE_MARKERS = {
  // Уникальный маркер для архивирования - скрыт для пользователя
  ARCHIVE_TAG: "__AR__",
  
  // Маркер восстановления из архива - скрыт для пользователя
  RESTORE_TAG: "__RS__",
  
  // Маркер успешной заявки (записанный ученик)
  SUCCESS_TAG: "__SU__",
  
  // Текстовые метки для пользовательского интерфейса
  ARCHIVE_LABEL: "Архивирована",
  RESTORE_LABEL: "Восстановлена",
  SUCCESS_LABEL: "Успешно записан",
  
  // Маркеры для сообщений в примечаниях - без технических меток
  ARCHIVE_MESSAGE: "Заявка архивирована",
  RESTORE_MESSAGE: "Восстановлена из архива",
  SUCCESS_MESSAGE: "Успешная запись ученика"
};

/**
 * Сервис для работы с архивированием заявок (отказы и успешные заявки)
 * Следует принципу единственной ответственности (SRP) из SOLID
 * Переименован для отражения более широкой функциональности
 */
export class RequestArchiveService {
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
   * Проверяет, является ли заявка успешной и архивированной
   * @param request Заявка для проверки
   * @returns true, если заявка успешная и архивирована
   */
  static isSuccessfulArchived(request: ExtendedTrialRequest): boolean {
    // Заявка считается успешной архивной, если она содержит маркер успеха и архивации
    return !!(
      request.notes && 
      request.notes.includes(ARCHIVE_MARKERS.SUCCESS_TAG) && 
      request.notes.includes(ARCHIVE_MARKERS.ARCHIVE_TAG)
    );
  }
  
  /**
   * Проверяет, является ли заявка успешной (записанный ученик)
   * @param request Заявка для проверки
   * @returns true, если заявка помечена как успешная
   */
  static isSuccessful(request: ExtendedTrialRequest): boolean {
    // Заявка успешная, если содержит маркер успеха или находится в статусе "Записан"
    return !!(
      (request.notes && request.notes.includes(ARCHIVE_MARKERS.SUCCESS_TAG)) || 
      request.status === "SIGNED"
    );
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
    return `[${ARCHIVE_MARKERS.ARCHIVE_MESSAGE} ${date}] ${ARCHIVE_MARKERS.ARCHIVE_TAG}`;
  }
  
  /**
   * Формирует метку успешной заявки для примечаний
   * @returns Строка с меткой успешной заявки
   */
  static getSuccessMarker(): string {
    const date = new Date().toLocaleDateString();
    return `[${ARCHIVE_MARKERS.SUCCESS_MESSAGE} ${date}] ${ARCHIVE_MARKERS.SUCCESS_TAG}`;
  }
  
  /**
   * Формирует метку восстановления для примечаний
   * @returns Строка с меткой восстановления
   */
  static getRestoreMarker(): string {
    const date = new Date().toLocaleDateString();
    return `[${ARCHIVE_MARKERS.RESTORE_MESSAGE} ${date}] ${ARCHIVE_MARKERS.RESTORE_TAG}`;
  }
  
  /**
   * Очищает примечания от технических маркеров
   * @param notes Исходный текст примечаний
   * @returns Текст примечаний без технических маркеров
   */
  static cleanNotesForDisplay(notes: string): string {
    if (!notes) return '';
    
    // Удаляем все технические маркеры и сообщения о архивации/восстановлении
    // Последовательно применяем регулярные выражения для полной очистки
    const cleaned = notes
      // Удаляем короткие коды маркеров
      .replace(new RegExp(ARCHIVE_MARKERS.ARCHIVE_TAG, 'g'), '')
      .replace(new RegExp(ARCHIVE_MARKERS.RESTORE_TAG, 'g'), '')
      .replace(new RegExp(ARCHIVE_MARKERS.SUCCESS_TAG, 'g'), '')
      
      // Удаляем все метки с квадратными скобками, содержащие упоминания об архивировании/восстановлении
      .replace(/\[[^\]]*(?:архивирован|архив|успешная|записан|восстановлен)[^\]]*\]/gi, '')
      
      // Удаляем все форматы старых технических меток 
      .replace(/\[___[A-Z_]+___\]/gi, '')
      .replace(/___[A-Z_]+___/g, '')
      
      // Удаляем все метки __XXX__ любого формата (двойные подчеркивания)
      .replace(/__[A-Z_]+__/g, '')
      
      // Удаляем остаточные упоминания о статусах, которые могли остаться
      .replace(/статус:?\s*(?:архивировано|восстановлено|записан)/gi, '')
      
      // Удаляем остаточные форматы с датой архивирования/восстановления
      .replace(/(?:архивирован|восстановлен|записан)[а]?\s+\d{1,2}\.\d{1,2}\.\d{4}/gi, '')
      
      // Оптимизируем оставшийся текст - удаляем множественные пробелы
      .replace(/\s{2,}/g, ' ')
      
      // Удаляем пробелы перед знаками препинания
      .replace(/\s+([,.!?;:])/g, '$1')
      
      // Окончательная очистка и форматирование
      .trim();
    
    return cleaned;
  }
  
  /**
   * Архивирует успешную заявку (ученик был записан)
   * @param requestId ID заявки для архивирования
   * @param oldNotes Предыдущие примечания (если есть)
   * @param optimisticCallback Колбэк для оптимистичного обновления UI
   * @returns Promise<{success: boolean, notes: string}> Результат операции и обновленные примечания
   */
  static async archiveSuccessfulRequest(
    requestId: number, 
    oldNotes?: string, 
    optimisticCallback?: (id: number, notes: string) => void
  ): Promise<{success: boolean, notes: string}> {
    try {
      console.log(`RequestArchiveService: Архивирование успешной заявки ID=${requestId}`);
      
      // Проверяем, архивирована ли уже заявка
      if (oldNotes && oldNotes.includes(ARCHIVE_MARKERS.ARCHIVE_TAG)) {
        console.log('Заявка уже содержит тег архивирования');
        return { success: true, notes: oldNotes };
      }
      
      // Создаем текст примечаний с маркерами успешной заявки и архивирования
      const successMarker = this.getSuccessMarker();
      const archiveMarker = this.getArchiveMarker();
      const notes = oldNotes 
        ? `${oldNotes.trim()} ${successMarker} ${archiveMarker}`
        : `${successMarker} ${archiveMarker}`;
      
      // Вызываем оптимистичный колбэк до выполнения запроса для мгновенного обновления UI
      if (optimisticCallback) {
        optimisticCallback(requestId, notes);
      }
      
      console.log('Архивирование успешной заявки с примечаниями:', notes);
      
      // Отправляем запрос к API с обновленными примечаниями и сохраняем статус SIGNED
      const response = await apiRequest(
        "PATCH",
        `/api/trial-requests/${requestId}/status`,
        { 
          notes,
          status: "SIGNED" // Сохраняем статус "Записан"
        }
      );
      
      // Проверяем успешность запроса
      const success = response.ok;
      
      if (success) {
        console.log('Успешная заявка архивирована');
      } else {
        console.error('Ошибка при архивировании:', await response.text());
      }
      
      return { success, notes };
    } catch (error) {
      console.error('Ошибка при архивировании успешной заявки:', error);
      return { success: false, notes: oldNotes || '' };
    }
  }
  
  /**
   * Архивирует заявку на отказ
   * @param requestId ID заявки для архивирования
   * @param oldNotes Предыдущие примечания (если есть)
   * @param optimisticCallback Колбэк для оптимистичного обновления UI
   * @returns Promise<{success: boolean, notes: string}> Результат операции и обновленные примечания
   */
  static async archiveRefusal(
    requestId: number, 
    oldNotes?: string, 
    optimisticCallback?: (id: number, notes: string) => void
  ): Promise<{success: boolean, notes: string}> {
    try {
      console.log(`RequestArchiveService: Архивирование заявки ID=${requestId}`);
      
      // Проверяем, архивирована ли уже заявка
      if (oldNotes && oldNotes.includes(ARCHIVE_MARKERS.ARCHIVE_TAG)) {
        console.log('Заявка уже содержит тег архивирования');
        return { success: true, notes: oldNotes };
      }
      
      // Создаем текст примечаний с маркером архивирования
      const archiveMarker = this.getArchiveMarker();
      const notes = oldNotes 
        ? `${oldNotes.trim()} ${archiveMarker}`
        : archiveMarker;
      
      // Вызываем оптимистичный колбэк до выполнения запроса для мгновенного обновления UI
      if (optimisticCallback) {
        optimisticCallback(requestId, notes);
      }
      
      console.log('Архивирование с примечаниями:', notes);
      
      // Отправляем запрос к API с обновленными примечаниями и статусом REFUSED
      const response = await apiRequest(
        "PATCH",
        `/api/trial-requests/${requestId}/status`,
        { 
          notes,
          status: "REFUSED" // Подтверждаем статус отказа
        }
      );
      
      // Проверяем успешность запроса
      const success = response.ok;
      
      if (success) {
        console.log('Заявка успешно архивирована');
      } else {
        console.error('Ошибка при архивировании:', await response.text());
      }
      
      return { success, notes };
    } catch (error) {
      console.error('Ошибка при архивировании заявки:', error);
      return { success: false, notes: oldNotes || '' };
    }
  }
  
  /**
   * Восстанавливает заявку из архива
   * @param requestId ID заявки для восстановления
   * @returns Promise<{success: boolean, notes: string}> Результат операции и обновленные примечания
   */
  static async restoreFromArchive(
    requestId: number
  ): Promise<{success: boolean, notes: string}> {
    try {
      console.log(`RequestArchiveService: Восстановление заявки ID=${requestId}`);
      
      // Получаем текущие данные заявки
      const response = await apiRequest("GET", `/api/trial-requests/${requestId}`);
      if (!response.ok) {
        console.error('Не удалось получить данные заявки:', await response.text());
        return { success: false, notes: '' };
      }
      
      const request = await getResponseData<ExtendedTrialRequest>(response);
      
      // Подготавливаем текст примечаний без маркеров архивирования
      let notes = request.notes || '';
      
      // Сначала полностью очищаем от всех технических меток
      notes = this.cleanNotesForDisplay(notes);
      
      // Добавляем новый маркер восстановления - будет скрыт при отображении
      const restoreMarker = this.getRestoreMarker();
      notes = `${notes} ${restoreMarker}`.trim();
      
      console.log('Восстановление с примечаниями (техническими для сервера):', notes);
      
      // Отправляем запрос к API для обновления заявки через маршрут status
      const updateResponse = await apiRequest(
        "PATCH",
        `/api/trial-requests/${requestId}/status`,
        { 
          notes,
          status: request.status  // Сохраняем текущий статус
        }
      );
      
      // Проверяем успешность запроса
      const success = updateResponse.ok;
      
      if (success) {
        console.log('Заявка успешно восстановлена из архива');
      } else {
        console.error('Ошибка при восстановлении:', await updateResponse.text());
      }
      
      return { success, notes };
    } catch (error) {
      console.error('Ошибка при восстановлении заявки из архива:', error);
      return { success: false, notes: '' };
    }
  }
  
  /**
   * Архивирует сразу несколько заявок
   * @param requests Список заявок для архивирования
   * @param optimisticCallback Колбэк для оптимистичного обновления UI
   * @returns Promise<number> Количество успешно архивированных заявок
   */
  static async archiveBatch(
    requests: ExtendedTrialRequest[], 
    optimisticCallback?: (id: number, notes: string) => void
  ): Promise<number> {
    let successCount = 0;
    
    // Создаем копию списка для параллельной обработки
    const promises = requests.map(async (request) => {
      const { success, notes } = await this.archiveRefusal(
        request.id, 
        request.notes || undefined,
        optimisticCallback
      );
      
      return { success, requestId: request.id, notes };
    });
    
    // Дожидаемся выполнения всех запросов параллельно
    const results = await Promise.all(promises);
    
    // Подсчитываем количество успешных операций
    successCount = results.filter(r => r.success).length;
    
    return successCount;
  }
  
  /**
   * Архивирует сразу несколько успешных заявок
   * @param requests Список успешных заявок для архивирования
   * @param optimisticCallback Колбэк для оптимистичного обновления UI
   * @returns Promise<number> Количество успешно архивированных заявок
   */
  static async archiveSuccessfulBatch(
    requests: ExtendedTrialRequest[], 
    optimisticCallback?: (id: number, notes: string) => void
  ): Promise<number> {
    let successCount = 0;
    
    // Создаем копию списка для параллельной обработки
    const promises = requests.map(async (request) => {
      const { success, notes } = await this.archiveSuccessfulRequest(
        request.id, 
        request.notes || undefined,
        optimisticCallback
      );
      
      return { success, requestId: request.id, notes };
    });
    
    // Дожидаемся выполнения всех запросов параллельно
    const results = await Promise.all(promises);
    
    // Подсчитываем количество успешных операций
    successCount = results.filter(r => r.success).length;
    
    return successCount;
  }
  
  /**
   * Получает текст для отображения в пользовательском интерфейсе
   * Полностью удаляет все технические маркеры из примечаний
   * @param request Заявка
   * @returns Объект с очищенными текстами
   */
  static getDisplayTexts(request: ExtendedTrialRequest): { 
    notes: string, 
    status: string,
    archiveStatus?: string,
    archiveDate?: string
  } {
    // Получаем чистые примечания без технических меток
    const cleanNotes = this.cleanNotesForDisplay(request.notes || '');
    
    // Определяем статус архивирования для отображения
    let archiveStatus = undefined;
    let archiveDate = undefined;
    
    // Определяем дату архивирования, если есть
    if (this.isArchived(request) && request.notes) {
      archiveStatus = ARCHIVE_MARKERS.ARCHIVE_LABEL;
      
      // Попытка извлечь дату архивирования
      const datePatterns = [
        // Стандартный шаблон для новых заявок
        new RegExp(`${ARCHIVE_MARKERS.ARCHIVE_MESSAGE}\\s+(\\d{1,2}\\.\\d{1,2}\\.\\d{4})`),
        // Шаблон для старых заявок 
        /(?:автоматически )?архивирована\s+(\d{1,2}\.\d{1,2}\.\d{4})/i,
      ];
      
      for (const pattern of datePatterns) {
        const match = request.notes.match(pattern);
        if (match && match[1]) {
          archiveDate = match[1];
          break;
        }
      }
      
      // Если дату найти не удалось, возвращаем текущую
      if (!archiveDate) {
        archiveDate = new Date().toLocaleDateString();
      }
    } else if (this.isRestored(request)) {
      archiveStatus = ARCHIVE_MARKERS.RESTORE_LABEL;
    } else if (this.isSuccessful(request)) {
      archiveStatus = ARCHIVE_MARKERS.SUCCESS_LABEL;
    }
    
    return {
      notes: cleanNotes,
      status: request.status,
      archiveStatus,
      archiveDate
    };
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
  
  /**
   * Фильтрует успешные заявки старше указанного количества дней
   * @param requests Список заявок
   * @param days Количество дней
   * @returns Отфильтрованный список успешных заявок
   */
  static filterOldSuccessful(requests: ExtendedTrialRequest[], days: number = 3): ExtendedTrialRequest[] {
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - days));
    
    return requests.filter(request => {
      // Фильтруем только успешные заявки (статус "Записан")
      if (request.status !== "SIGNED") return false;
      
      // Проверяем, что заявка достаточно старая
      const requestDate = new Date(request.updatedAt || request.createdAt || Date.now());
      return requestDate < cutoffDate;
    });
  }
}