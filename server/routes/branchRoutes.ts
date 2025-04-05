import { Router } from 'express';
import { authRequired, validateRequest } from '../middleware/error';
import * as branchController from '../controllers/branchController';
import * as sectionController from '../controllers/sectionController';
import { insertBranchSchema } from '@shared/schema';

const router = Router();

// Публичные маршруты (не требуют авторизации)
router.get('/', branchController.getAllBranches);
router.get('/by-section', sectionController.getBranchesBySection);

// Защищенные маршруты (требуют авторизации)
router.get('/:id', authRequired, branchController.getBranchById);

router.post('/', 
  authRequired,
  validateRequest(insertBranchSchema),
  branchController.createBranch
);

router.put('/:id', 
  authRequired,
  branchController.updateBranch
);

router.delete('/:id', 
  authRequired,
  branchController.deleteBranch
);

export default router;