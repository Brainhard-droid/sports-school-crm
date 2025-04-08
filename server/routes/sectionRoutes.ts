import { Router } from 'express';
import { SectionController } from '../controllers/sectionController';
import { isAuthenticated } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';

const router = Router();

/**
 * @route GET /api/sections
 * @desc Получить все спортивные секции
 * @access Public
 */
router.get('/', SectionController.getAllSections);

/**
 * @route GET /api/sections/:id
 * @desc Получить спортивную секцию по ID
 * @access Public
 */
router.get(
  '/:id', 
  validateParams(SectionController.validationSchemas.params), 
  SectionController.getSectionById
);

/**
 * @route POST /api/sections
 * @desc Создать новую спортивную секцию
 * @access Private
 */
router.post(
  '/', 
  isAuthenticated,
  validateBody(SectionController.validationSchemas.create), 
  SectionController.createSection
);

/**
 * @route PATCH /api/sections/:id
 * @desc Обновить спортивную секцию
 * @access Private
 */
router.patch(
  '/:id', 
  isAuthenticated,
  validateParams(SectionController.validationSchemas.params),
  validateBody(SectionController.validationSchemas.update), 
  SectionController.updateSection
);

/**
 * @route DELETE /api/sections/:id
 * @desc Удалить спортивную секцию (мягкое удаление)
 * @access Private
 */
router.delete(
  '/:id', 
  isAuthenticated,
  validateParams(SectionController.validationSchemas.params), 
  SectionController.deleteSection
);

export default router;
