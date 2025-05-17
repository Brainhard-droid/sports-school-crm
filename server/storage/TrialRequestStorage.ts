import { 
  TrialRequest, InsertTrialRequest, trialRequests, TrialRequestStatus,
  sportsSections, branches
} from "@shared/schema";
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { ITrialRequestStorage } from "../interfaces/storage/ITrialRequestStorage";

/**
 * Реализация хранилища заявок на пробное занятие
 */
export class TrialRequestStorage implements ITrialRequestStorage {
  /**
   * Получает все заявки на пробное занятие
   * 
   * @returns Массив заявок
   */
  async getAllTrialRequests(): Promise<TrialRequest[]> {
    try {
      console.log('Getting all trial requests with archived filter');
      return await db
        .select()
        .from(trialRequests)
        .where(eq(trialRequests.archived, false))
        .orderBy(desc(trialRequests.createdAt));
    } catch (error) {
      console.error('Error getting all trial requests:', error);
      throw error;
    }
  }
  
  /**
   * Получает заявки по статусу
   * 
   * @param status Статус заявки
   * @returns Массив заявок
   */
  async getTrialRequestsByStatus(status: keyof typeof TrialRequestStatus): Promise<TrialRequest[]> {
    try {
      return await db
        .select()
        .from(trialRequests)
        .where(eq(trialRequests.status, status));
    } catch (error) {
      console.error('Error getting trial requests by status:', error);
      throw error;
    }
  }
  
  /**
   * Получает заявку по ID
   * 
   * @param id ID заявки
   * @returns Заявка или undefined, если не найдена
   */
  async getTrialRequestById(id: number): Promise<TrialRequest | undefined> {
    try {
      const [request] = await db
        .select()
        .from(trialRequests)
        .where(eq(trialRequests.id, id));
      
      return request;
    } catch (error) {
      console.error('Error getting trial request by ID:', error);
      throw error;
    }
  }
  
  /**
   * Создает новую заявку
   * 
   * @param data Данные для создания заявки
   * @returns Созданная заявка
   */
  async createTrialRequest(data: InsertTrialRequest): Promise<TrialRequest> {
    try {
      const [request] = await db
        .insert(trialRequests)
        .values(data)
        .returning();
      
      return request;
    } catch (error) {
      console.error('Error creating trial request:', error);
      throw error;
    }
  }
  
  /**
   * Обновляет статус заявки
   * 
   * @param id ID заявки
   * @param status Новый статус
   * @param scheduledDate Дата проведения пробного занятия (опционально)
   * @returns Обновленная заявка
   */
  async updateTrialRequestStatus(
    id: number, 
    status: keyof typeof TrialRequestStatus, 
    scheduledDate?: Date
  ): Promise<TrialRequest> {
    try {
      const updateData: Partial<TrialRequest> = { status };
      
      if (scheduledDate) {
        updateData.scheduledDate = scheduledDate;
      }
      
      const [request] = await db
        .update(trialRequests)
        .set(updateData)
        .where(eq(trialRequests.id, id))
        .returning();
      
      return request;
    } catch (error) {
      console.error('Error updating trial request status:', error);
      throw error;
    }
  }
  
  /**
   * Обновляет заявку
   * 
   * @param id ID заявки
   * @param data Данные для обновления
   * @returns Обновленная заявка
   */
  async updateTrialRequest(id: number, data: Partial<InsertTrialRequest> & { archived?: boolean }): Promise<TrialRequest> {
    try {
      // Если установлен флаг archived, обновляем его вместе с остальными данными
      const updateData = {
        ...data,
        archived: data.archived
      };
      
      const [request] = await db
        .update(trialRequests)
        .set(updateData)
        .where(eq(trialRequests.id, id))
        .returning();
      
      return request;
    } catch (error) {
      console.error('Error updating trial request:', error);
      throw error;
    }
  }
}