import { Router } from 'express';
import { createAttendance, bulkUpdateAttendance, getAttendanceByMonth } from '../controllers/attendanceController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Все эндпоинты требуют аутентификации
router.use(isAuthenticated);

// Получение посещаемости за месяц
router.get('/', getAttendanceByMonth);

// Создание записи о посещаемости
router.post('/', createAttendance);

// Массовое обновление посещаемости
router.post('/bulk', bulkUpdateAttendance);

export default router;