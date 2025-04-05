import { Router } from 'express';
import { authRequired, validateRequest } from '../middleware/error';
import * as sectionController from '../controllers/sectionController';
import { insertSportsSectionSchema, insertBranchSectionSchema } from '@shared/schema';

const router = Router();

// Публичные маршруты (не требуют авторизации)
router.get('/', sectionController.getAllSportsSections);
router.get('/by-branch', sectionController.getSectionsByBranch);

// Защищенные маршруты (требуют авторизации)
router.get('/:id', authRequired, sectionController.getSportsSectionById);

router.post('/', 
  authRequired,
  validateRequest(insertSportsSectionSchema),
  sectionController.createSportsSection
);

router.put('/:id', 
  authRequired,
  sectionController.updateSportsSection
);

router.delete('/:id', 
  authRequired,
  sectionController.deleteSportsSection
);

// Маршруты для связей между секциями и филиалами
router.post('/branch-connection', 
  authRequired,
  validateRequest(insertBranchSectionSchema),
  sectionController.createBranchSection
);

export default router;