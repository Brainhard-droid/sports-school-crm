import { Router } from 'express';
import branchRoutes from './branchRoutes';
import sectionRoutes from './sectionRoutes';
import branchSectionRoutes from './branchSectionRoutes';
import trialRequestRoutes from './trialRequestRoutes';
import studentRoutes from './studentRoutes';
import attendanceRoutes from './attendanceRoutes';
import dateCommentRoutes from './dateCommentRoutes';

const router = Router();

// Регистрация маршрутов
router.use('/branches', branchRoutes);
router.use('/sections', sectionRoutes);
router.use('/branch-sections', branchSectionRoutes);
// Включаем маршруты для управления пользователями
import userRoutes from './userRoutes';
router.use('/users', userRoutes);
router.use('/trial-requests', trialRequestRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/date-comments', dateCommentRoutes);

export default router;
