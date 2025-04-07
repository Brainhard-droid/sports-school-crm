import { TrialRequest, InsertTrialRequest, TrialRequestStatus } from "@shared/schema";

/**
 * Интерфейс для хранилища заявок на пробное занятие
 */
export interface ITrialRequestStorage {
  /**
   * Получает все заявки на пробное занятие
   * 
   * @returns Массив заявок
   */
  getAllTrialRequests(): Promise<TrialRequest[]>;
  
  /**
   * Получает заявки по статусу
   * 
   * @param status Статус заявки
   * @returns Массив заявок
   */
  getTrialRequestsByStatus(status: keyof typeof TrialRequestStatus): Promise<TrialRequest[]>;
  
  /**
   * Получает заявку по ID
   * 
   * @param id ID заявки
   * @returns Заявка или undefined, если не найдена
   */
  getTrialRequestById(id: number): Promise<TrialRequest | undefined>;
  
  /**
   * Создает новую заявку
   * 
   * @param data Данные для создания заявки
   * @returns Созданная заявка
   */
  createTrialRequest(data: InsertTrialRequest): Promise<TrialRequest>;
  
  /**
   * Обновляет статус заявки
   * 
   * @param id ID заявки
   * @param status Новый статус
   * @param scheduledDate Дата проведения пробного занятия (опционально)
   * @returns Обновленная заявка
   */
  updateTrialRequestStatus(
    id: number, 
    status: keyof typeof TrialRequestStatus, 
    scheduledDate?: Date
  ): Promise<TrialRequest>;
  
  /**
   * Обновляет заявку
   * 
   * @param id ID заявки
   * @param data Данные для обновления
   * @returns Обновленная заявка
   */
  updateTrialRequest(id: number, data: Partial<InsertTrialRequest>): Promise<TrialRequest>;
}