import { Router } from 'express';
import branchRoutes from './branchRoutes';
import sectionRoutes from './sectionRoutes';
import branchSectionRoutes from './branchSectionRoutes';

const router = Router();

// Регистрация маршрутов
router.use('/branches', branchRoutes);
router.use('/sections', sectionRoutes);
router.use('/branch-sections', branchSectionRoutes);

export default router;