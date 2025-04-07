import { Router } from 'express';
import { BranchSectionController } from '../controllers/branchSectionController';
import { isAuthenticated } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';

const router = Router();

/**
 * @route GET /api/branch-sections
 * @desc Получить все связи филиалов и секций
 * @access Public
 */
router.get('/', BranchSectionController.getAllBranchSections);

/**
 * @route GET /api/branch-sections/:id
 * @desc Получить связь филиала и секции по ID
 * @access Public
 */
router.get(
  '/:id',
  validateParams(BranchSectionController.validationSchemas.params),
  BranchSectionController.getBranchSectionById
);

/**
 * @route GET /api/branch-sections/section/:sectionId
 * @desc Получить филиалы по ID секции
 * @access Public
 */
router.get(
  '/section/:sectionId',
  validateParams(BranchSectionController.validationSchemas.params),
  BranchSectionController.getBranchesBySectionId
);

/**
 * @route POST /api/branch-sections
 * @desc Создать новую связь филиала и секции
 * @access Private
 */
router.post(
  '/',
  isAuthenticated,
  validateBody(BranchSectionController.validationSchemas.create),
  BranchSectionController.createBranchSection
);

/**
 * @route PATCH /api/branch-sections/:id
 * @desc Обновить связь филиала и секции
 * @access Private
 */
router.patch(
  '/:id',
  isAuthenticated,
  validateParams(BranchSectionController.validationSchemas.params),
  validateBody(BranchSectionController.validationSchemas.update),
  BranchSectionController.updateBranchSection
);

/**
 * @route DELETE /api/branch-sections/:id
 * @desc Удалить связь филиала и секции (мягкое удаление)
 * @access Private
 */
router.delete(
  '/:id',
  isAuthenticated,
  validateParams(BranchSectionController.validationSchemas.params),
  BranchSectionController.deleteBranchSection
);

/**
 * @route POST /api/branch-sections/sync
 * @desc Синхронизировать связи филиалов и секций
 * @access Private
 */
router.post(
  '/sync',
  isAuthenticated,
  BranchSectionController.syncBranchSections
);

export default router;