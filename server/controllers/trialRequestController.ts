import { Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler, ApiErrorClass } from '../middleware/error';
import { sendTrialAssignmentNotification } from '../services/email';
import { TrialRequestStatus, insertTrialRequestSchema } from '@shared/schema';
import { z } from 'zod';

// Схемы валидации
const paramsSchema = z.object({
  id: z.string().transform((val) => parseInt(val)),
});

const updateStatusSchema = z.object({
  status: z.enum([
    TrialRequestStatus.NEW,
    TrialRequestStatus.TRIAL_ASSIGNED,
    TrialRequestStatus.REFUSED,
    TrialRequestStatus.SIGNED,
  ]),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
});

const createSchema = insertTrialRequestSchema.extend({ 
  consentToDataProcessing: z.boolean().refine(val => val === true, {
    message: 'Необходимо согласие на обработку персональных данных',
  })
});

const updateSchema = insertTrialRequestSchema.partial();

/**
 * Контроллер для заявок на пробные занятия
 */
export class TrialRequestController {
  /**
   * Схемы валидации для контроллера
   */
  static validationSchemas = {
    params: paramsSchema,
    create: createSchema,
    update: updateSchema,
    updateStatus: updateStatusSchema
  };

  /**
   * Получение всех заявок на пробные занятия
   */
  static getAllTrialRequests = asyncHandler(async (req: Request, res: Response) => {
    console.log('Getting all trial requests...');
    const requests = await storage.getAllTrialRequests();
    res.json(requests);
  });

  /**
   * Получение заявки на пробное занятие по ID
   */
  static getTrialRequestById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ApiErrorClass('Некорректный ID заявки', 400);
    }

    const request = await storage.getTrialRequestById(id);
    if (!request) {
      throw new ApiErrorClass('Заявка не найдена', 404);
    }

    res.json(request);
  });

  /**
   * Создание новой заявки на пробное занятие
   */
  static createTrialRequest = asyncHandler(async (req: Request, res: Response) => {
    const {
      childName,
      childAge,
      parentName,
      parentPhone,
      sectionId,
      branchId,
      desiredDate,
      notes,
      consentToDataProcessing
    } = req.body;

    // Проверяем согласие на обработку данных
    if (!consentToDataProcessing) {
      throw new ApiErrorClass('Необходимо согласие на обработку персональных данных', 400);
    }

    // Проверяем существование секции и филиала
    const section = await storage.getSectionById(sectionId);
    if (!section) {
      throw new ApiErrorClass('Указанная секция не найдена', 404);
    }

    const branch = await storage.getBranchById(branchId);
    if (!branch) {
      throw new ApiErrorClass('Указанный филиал не найден', 404);
    }

    // Создаем заявку
    const request = await storage.createTrialRequest({
      childName,
      childAge,
      parentName,
      parentPhone,
      sectionId,
      branchId,
      desiredDate,
      notes
    });

    res.status(201).json(request);
  });

  /**
   * Обновление статуса заявки на пробное занятие
   */
  static updateTrialRequestStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ApiErrorClass('Некорректный ID заявки', 400);
    }

    const { status, scheduledDate, notes } = req.body;

    // Проверяем, существует ли заявка
    const existingRequest = await storage.getTrialRequestById(id);
    if (!existingRequest) {
      throw new ApiErrorClass('Заявка не найдена', 404);
    }

    // Проверяем статус
    if (status && !Object.values(TrialRequestStatus).includes(status)) {
      throw new ApiErrorClass('Некорректный статус заявки', 400);
    }

    // Подготавливаем данные для обновления
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
    }
    
    if (scheduledDate) {
      updateData.scheduledDate = new Date(scheduledDate);
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Обновляем заявку
    const updatedRequest = await storage.updateTrialRequest(id, updateData);

    // Отправляем уведомление клиенту, если статус изменен на TRIAL_ASSIGNED
    if (status === TrialRequestStatus.TRIAL_ASSIGNED && scheduledDate) {
      try {
        // Получаем дополнительные данные для уведомления
        const section = await storage.getSectionById(updatedRequest.sectionId);
        const branch = await storage.getBranchById(updatedRequest.branchId);
        
        if (section && branch) {
          await sendTrialAssignmentNotification(updatedRequest, section, branch);
        } else {
          console.error('Cannot send notification: section or branch not found');
        }
      } catch (error) {
        console.error('Failed to send trial assignment notification:', error);
        // Не прерываем выполнение, если отправка уведомления не удалась
      }
    }

    res.json(updatedRequest);
  });

  /**
   * Полное обновление заявки на пробное занятие
   */
  static updateTrialRequest = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ApiErrorClass('Некорректный ID заявки', 400);
    }

    // Проверяем, существует ли заявка
    const existingRequest = await storage.getTrialRequestById(id);
    if (!existingRequest) {
      throw new ApiErrorClass('Заявка не найдена', 404);
    }

    // Получаем данные для обновления
    const {
      childName,
      childAge,
      parentName,
      parentPhone,
      sectionId,
      branchId,
      desiredDate,
      notes
    } = req.body;

    // Подготавливаем данные для обновления
    const updateData: any = {};

    if (childName) updateData.childName = childName;
    if (childAge) updateData.childAge = childAge;
    if (parentName) updateData.parentName = parentName;
    if (parentPhone) updateData.parentPhone = parentPhone;
    if (sectionId) updateData.sectionId = sectionId;
    if (branchId) updateData.branchId = branchId;
    if (desiredDate) updateData.desiredDate = desiredDate;
    if (notes !== undefined) updateData.notes = notes;

    // Обновляем заявку
    const updatedRequest = await storage.updateTrialRequest(id, updateData);

    res.json(updatedRequest);
  });

  /**
   * Удаление заявки на пробное занятие
   */
  static deleteTrialRequest = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ApiErrorClass('Некорректный ID заявки', 400);
    }

    // Проверяем, существует ли заявка
    const existingRequest = await storage.getTrialRequestById(id);
    if (!existingRequest) {
      throw new ApiErrorClass('Заявка не найдена', 404);
    }

    // Пока нет метода удаления, просто обновим статус на REFUSED
    await storage.updateTrialRequestStatus(id, TrialRequestStatus.REFUSED);

    res.status(204).send();
  });
}
