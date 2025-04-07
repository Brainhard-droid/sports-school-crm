import { Payment, InsertPayment } from "@shared/schema";

/**
 * Интерфейс для хранилища платежей
 */
export interface IPaymentStorage {
  /**
   * Получает платежи, опционально фильтруя по студенту
   * 
   * @param studentId ID студента (опционально)
   * @returns Массив платежей
   */
  getPayments(studentId?: number): Promise<Payment[]>;
  
  /**
   * Создает новый платеж
   * 
   * @param payment Данные для создания платежа
   * @returns Созданный платеж
   */
  createPayment(payment: InsertPayment): Promise<Payment>;
}