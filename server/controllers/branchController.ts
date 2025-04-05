import { Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler, ApiErrorClass } from '../middleware/error';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { branches } from '@shared/schema';

/**
 * Получение всех филиалов
 */
export const getAllBranches = asyncHandler(async (req: Request, res: Response) => {
  try {
    const allBranches = await db
      .select()
      .from(branches)
      .where(eq(branches.active, true)); // Только активные филиалы
    res.json(allBranches);
  } catch (error) {
    console.error('Error getting branches:', error);
    throw new ApiErrorClass('Ошибка при получении списка филиалов', 500);
  }
});

/**
 * Получение филиала по ID
 */
export const getBranchById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new ApiErrorClass('Некорректный ID филиала', 400);
  }

  const branch = await storage.getBranch(id);
  if (!branch) {
    throw new ApiErrorClass('Филиал не найден', 404);
  }

  res.json(branch);
});

/**
 * Создание нового филиала
 */
export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  const { name, address, phone, active = true } = req.body;

  // Создаем филиал
  const branch = await storage.createBranch({
    name,
    address,
    phone,
    active
  });

  res.status(201).json(branch);
});

/**
 * Обновление филиала
 */
export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new ApiErrorClass('Некорректный ID филиала', 400);
  }

  const { name, address, phone, active } = req.body;

  // Проверяем, существует ли филиал
  const existingBranch = await storage.getBranch(id);
  if (!existingBranch) {
    throw new ApiErrorClass('Филиал не найден', 404);
  }

  // Подготавливаем данные для обновления
  const updateData: any = {};
  if (name) updateData.name = name;
  if (address) updateData.address = address;
  if (phone) updateData.phone = phone;
  if (active !== undefined) updateData.active = active;

  // Обновляем филиал
  const updatedBranch = await storage.updateBranch(id, updateData);

  res.json(updatedBranch);
});

/**
 * Удаление филиала
 */
export const deleteBranch = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new ApiErrorClass('Некорректный ID филиала', 400);
  }

  // Проверяем, существует ли филиал
  const existingBranch = await storage.getBranch(id);
  if (!existingBranch) {
    throw new ApiErrorClass('Филиал не найден', 404);
  }

  // Удаляем филиал
  await storage.deleteBranch(id);

  res.status(204).send();
});