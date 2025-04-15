import { Router } from 'express';
import branchRoutes from './branchRoutes';
import sectionRoutes from './sectionRoutes';
import branchSectionRoutes from './branchSectionRoutes';
import userRoutes from './userRoutes';
import trialRequestRoutes from './trialRequestRoutes';
import studentRoutes from './studentRoutes';
import attendanceRoutes from './attendanceRoutes';
import dateCommentRoutes from './dateCommentRoutes';
import healthRoutes from './health';
import diagnosticsRoutes from './diagnostics';

const router = Router();

// Регистрация маршрутов
router.use('/', healthRoutes);
router.use('/', diagnosticsRoutes);
router.use('/branches', branchRoutes);
router.use('/sections', sectionRoutes);
router.use('/branch-sections', branchSectionRoutes);
router.use('/users', userRoutes);
router.use('/trial-requests', trialRequestRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/date-comments', dateCommentRoutes);

export default router;
