import { Request, Response } from 'express';
import { BranchSectionService } from '../services/branchSectionService';
import { asyncHandler } from '../middleware/error';
import { z } from 'zod';
import { insertBranchSectionSchema } from '@shared/schema';

/**
 * Контроллер для работы с связями филиалов и спортивных секций
 */
export const BranchSectionController = {
  /**
   * Получить все связи филиалов и секций
   */
  getAllBranchSections: asyncHandler(async (req: Request, res: Response) => {
    const showAll = req.query.showAll === 'true';
    const branchSections = await BranchSectionService.getAllBranchSections(showAll);
    res.json(branchSections);
  }),

  /**
   * Получить связь филиала и секции по ID
   */
  getBranchSectionById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const branchSection = await BranchSectionService.getBranchSectionById(id);
    res.json(branchSection);
  }),

  /**
   * Получить филиалы по ID секции
   */
  getBranchesBySectionId: asyncHandler(async (req: Request, res: Response) => {
    const sectionId = parseInt(req.params.sectionId);
    const branches = await BranchSectionService.getBranchesBySectionId(sectionId);
    res.json(branches);
  }),

  /**
   * Создать новую связь филиала и секции
   */
  createBranchSection: asyncHandler(async (req: Request, res: Response) => {
    const branchSectionData = req.body;
    const newBranchSection = await BranchSectionService.createBranchSection(branchSectionData);
    res.status(201).json(newBranchSection);
  }),

  /**
   * Обновить связь филиала и секции
   */
  updateBranchSection: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const branchSectionData = req.body;
    const updatedBranchSection = await BranchSectionService.updateBranchSection(id, branchSectionData);
    res.json(updatedBranchSection);
  }),

  /**
   * Удалить связь филиала и секции (мягкое удаление)
   */
  deleteBranchSection: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await BranchSectionService.deleteBranchSection(id);
    res.status(204).end();
  }),

  /**
   * Синхронизировать связи филиалов и секций
   */
  syncBranchSections: asyncHandler(async (_req: Request, res: Response) => {
    await BranchSectionService.syncBranchSections();
    res.json({ message: 'Связи филиалов и секций успешно синхронизированы' });
  }),

  /**
   * Схемы валидации для связей филиалов и секций
   */
  validationSchemas: {
    create: insertBranchSectionSchema,
    update: insertBranchSectionSchema.partial(),
    params: z.object({
      id: z.string().transform(val => parseInt(val, 10)).optional(),
      sectionId: z.string().transform(val => parseInt(val, 10))
    })
  }
};