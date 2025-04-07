import { Request, Response } from 'express';
import { BranchService } from '../services/branchService';
import { asyncHandler } from '../middleware/error';
import { z } from 'zod';
import { insertBranchSchema } from '@shared/schema';

/**
 * Контроллер для работы с филиалами
 */
export const BranchController = {
  /**
   * Получить все филиалы
   */
  getAllBranches: asyncHandler(async (req: Request, res: Response) => {
    const showAll = req.query.showAll === 'true';
    const branches = await BranchService.getAllBranches(!showAll);
    res.json(branches);
  }),

  /**
   * Получить филиал по ID
   */
  getBranchById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const branch = await BranchService.getBranchById(id);
    res.json(branch);
  }),

  /**
   * Создать новый филиал
   */
  createBranch: asyncHandler(async (req: Request, res: Response) => {
    const branchData = req.body;
    const newBranch = await BranchService.createBranch(branchData);
    res.status(201).json(newBranch);
  }),

  /**
   * Обновить филиал
   */
  updateBranch: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const branchData = req.body;
    const updatedBranch = await BranchService.updateBranch(id, branchData);
    res.json(updatedBranch);
  }),

  /**
   * Удалить филиал (мягкое удаление)
   */
  deleteBranch: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await BranchService.deleteBranch(id);
    res.status(204).end();
  }),

  /**
   * Схемы валидации для филиалов
   */
  validationSchemas: {
    create: insertBranchSchema,
    update: insertBranchSchema.partial(),
    params: z.object({
      id: z.string().transform(val => parseInt(val, 10))
    })
  }
};