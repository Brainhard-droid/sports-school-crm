import { Router } from 'express';
import branchRoutes from './branchRoutes';
import sectionRoutes from './sectionRoutes';
import branchSectionRoutes from './branchSectionRoutes';
import userRoutes from './userRoutes';
import trialRequestRoutes from './trialRequestRoutes';
import studentRoutes from './studentRoutes';

const router = Router();

// Регистрация маршрутов
router.use('/branches', branchRoutes);
router.use('/sections', sectionRoutes);
router.use('/branch-sections', branchSectionRoutes);
router.use('/users', userRoutes);
router.use('/trial-requests', trialRequestRoutes);
router.use('/students', studentRoutes);

export default router;
