import { Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler, ApiErrorClass } from '../middleware/error';
import { sendTrialAssignmentNotification } from '../services/notifications';
import { TrialRequestStatus } from '@shared/schema';

/**
 * Получение всех заявок на пробные занятия
 */
export const getAllTrialRequests = asyncHandler(async (req: Request, res: Response) => {
  console.log('Getting all trial requests...');
  const requests = await storage.getTrialRequests();
  res.json(requests);
});

/**
 * Получение заявки на пробное занятие по ID
 */
export const getTrialRequestById = asyncHandler(async (req: Request, res: Response) => {
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
export const createTrialRequest = asyncHandler(async (req: Request, res: Response) => {
  const {
    childName,
    childAge,
    parentName,
    parentPhone,
    parentEmail,
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
  const section = await storage.getSportsSection(sectionId);
  if (!section) {
    throw new ApiErrorClass('Указанная секция не найдена', 404);
  }

  const branch = await storage.getBranch(branchId);
  if (!branch) {
    throw new ApiErrorClass('Указанный филиал не найден', 404);
  }

  // Создаем заявку
  const request = await storage.createTrialRequest({
    childName,
    childAge,
    parentName,
    parentPhone,
    parentEmail,
    sectionId,
    branchId,
    desiredDate: new Date(desiredDate),
    notes
  });

  res.status(201).json(request);
});

/**
 * Обновление статуса заявки на пробное занятие
 */
export const updateTrialRequestStatus = asyncHandler(async (req: Request, res: Response) => {
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
      await sendTrialAssignmentNotification(updatedRequest);
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
export const updateTrialRequest = asyncHandler(async (req: Request, res: Response) => {
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
    parentEmail,
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
  if (parentEmail) updateData.parentEmail = parentEmail;
  if (sectionId) updateData.sectionId = sectionId;
  if (branchId) updateData.branchId = branchId;
  if (desiredDate) updateData.desiredDate = new Date(desiredDate);
  if (notes !== undefined) updateData.notes = notes;

  // Обновляем заявку
  const updatedRequest = await storage.updateTrialRequest(id, updateData);

  res.json(updatedRequest);
});

/**
 * Удаление заявки на пробное занятие
 */
export const deleteTrialRequest = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new ApiErrorClass('Некорректный ID заявки', 400);
  }

  // Проверяем, существует ли заявка
  const existingRequest = await storage.getTrialRequestById(id);
  if (!existingRequest) {
    throw new ApiErrorClass('Заявка не найдена', 404);
  }

  // Удаляем заявку
  await storage.deleteTrialRequest(id);

  res.status(204).send();
});