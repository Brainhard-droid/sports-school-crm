import { Router } from 'express';
import { BranchController } from '../controllers/branchController';
import { isAuthenticated } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';

const router = Router();

/**
 * @route GET /api/branches
 * @desc Получить все филиалы
 * @access Public
 */
router.get('/', BranchController.getAllBranches);

/**
 * @route GET /api/branches/:id
 * @desc Получить филиал по ID
 * @access Public
 */
router.get(
  '/:id', 
  validateParams(BranchController.validationSchemas.params), 
  BranchController.getBranchById
);

/**
 * @route POST /api/branches
 * @desc Создать новый филиал
 * @access Private
 */
router.post(
  '/', 
  isAuthenticated,
  validateBody(BranchController.validationSchemas.create), 
  BranchController.createBranch
);

/**
 * @route PATCH /api/branches/:id
 * @desc Обновить филиал
 * @access Private
 */
router.patch(
  '/:id', 
  isAuthenticated,
  validateParams(BranchController.validationSchemas.params),
  validateBody(BranchController.validationSchemas.update), 
  BranchController.updateBranch
);

/**
 * @route DELETE /api/branches/:id
 * @desc Удалить филиал (мягкое удаление)
 * @access Private
 */
router.delete(
  '/:id', 
  isAuthenticated,
  validateParams(BranchController.validationSchemas.params), 
  BranchController.deleteBranch
);

export default router;
