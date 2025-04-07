import { Request, Response } from 'express';
import { SectionService } from '../services/sectionService';
import { asyncHandler } from '../middleware/error';
import { z } from 'zod';
import { insertSportsSectionSchema } from '@shared/schema';

/**
 * Контроллер для работы с спортивными секциями
 */
export const SectionController = {
  /**
   * Получить все спортивные секции
   */
  getAllSections: asyncHandler(async (req: Request, res: Response) => {
    const showAll = req.query.showAll === 'true';
    const sections = await SectionService.getAllSections(!showAll);
    res.json(sections);
  }),

  /**
   * Получить спортивную секцию по ID
   */
  getSectionById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const section = await SectionService.getSectionById(id);
    res.json(section);
  }),

  /**
   * Создать новую спортивную секцию
   */
  createSection: asyncHandler(async (req: Request, res: Response) => {
    const sectionData = req.body;
    const newSection = await SectionService.createSection(sectionData);
    res.status(201).json(newSection);
  }),

  /**
   * Обновить спортивную секцию
   */
  updateSection: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const sectionData = req.body;
    const updatedSection = await SectionService.updateSection(id, sectionData);
    res.json(updatedSection);
  }),

  /**
   * Удалить спортивную секцию (мягкое удаление)
   */
  deleteSection: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await SectionService.deleteSection(id);
    res.status(204).end();
  }),

  /**
   * Схемы валидации для спортивных секций
   */
  validationSchemas: {
    create: insertSportsSectionSchema,
    update: insertSportsSectionSchema.partial(),
    params: z.object({
      id: z.string().transform(val => parseInt(val, 10))
    })
  }
};