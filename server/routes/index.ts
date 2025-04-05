import { Router } from 'express';
import userRoutes from './userRoutes';
import trialRequestRoutes from './trialRequestRoutes';
import sectionRoutes from './sectionRoutes';
import branchRoutes from './branchRoutes';
import { notFoundHandler } from '../middleware/error';

// Основной роутер для API
const router = Router();

// Регистрируем все подроутеры
router.use('/users', userRoutes);
router.use('/trial-requests', trialRequestRoutes);
router.use('/sections', sectionRoutes);
router.use('/branches', branchRoutes);

// Обработка несуществующих маршрутов
router.use('*', notFoundHandler);

export default router;