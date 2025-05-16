import { ExtendedTrialRequest } from "@shared/schema";
import { apiRequest, getResponseData } from "@/lib/api";

/**
 * Сервис для работы с архивом отказов
 * Следует принципам Single Responsibility и Open/Closed
 */
export class RefusalArchiveService {
  private static readonly ARCHIVE_MARKER = '[Заявка автоматически архивирована';

  /**
   * Проверяет, является ли заявка архивированной
   */
  static isArchived(request: ExtendedTrialRequest): boolean {
    return request.notes?.includes(this.ARCHIVE_MARKER) || false;
  }

  /**
   * Фильтрует старые заявки
   */
  static filterOldRefusals(requests: ExtendedTrialRequest[], daysOld: number): ExtendedTrialRequest[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return requests.filter(request => {
      const requestDate = new Date(request.updatedAt || request.createdAt || Date.now());
      return requestDate < cutoffDate;
    });
  }

  /**
   * Архивирует заявку
   */
  static async archiveRefusal(requestId: number, oldNotes?: string): Promise<boolean> {
    try {
      const currentDate = new Date().toLocaleDateString();
      const archiveNote = `${this.ARCHIVE_MARKER} ${currentDate}]`;
      const notes = oldNotes ? `${oldNotes} ${archiveNote}` : archiveNote;

      const response = await apiRequest("PATCH", `/api/trial-requests/${requestId}`, { 
        notes,
        archived: true
      });

      return response.ok;
    } catch (error) {
      console.error('Ошибка при архивировании заявки:', error);
      return false;
    }
  }

  /**
   * Архивирует несколько заявок
   */
  static async archiveBatch(requests: ExtendedTrialRequest[]): Promise<number> {
    let archivedCount = 0;

    for (const request of requests) {
      const success = await this.archiveRefusal(request.id, request.notes);
      if (success) archivedCount++;
    }

    return archivedCount;
  }

  /**
   * Восстанавливает заявку из архива
   */
  static async restoreFromArchive(requestId: number): Promise<boolean> {
    try {
      const response = await apiRequest("GET", `/api/trial-requests/${requestId}`);
      const request = await getResponseData<ExtendedTrialRequest>(response);

      if (!request) return false;

      let notes = request.notes || '';
      notes = notes.replace(/\[Заявка автоматически архивирована[^\]]*\]/g, '')
        .trim() + ` [Восстановлена из архива ${new Date().toLocaleDateString()}]`;

      const updateResponse = await apiRequest("PATCH", `/api/trial-requests/${requestId}`, {
        notes,
        archived: false
      });

      return updateResponse.ok;
    } catch (error) {
      console.error('Ошибка при восстановлении из архива:', error);
      return false;
    }
  }
}