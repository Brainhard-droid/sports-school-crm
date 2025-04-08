import { Router } from 'express';
import { createAttendance, bulkUpdateAttendance, getAttendanceByMonth, updateAttendance } from '../controllers/attendanceController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Все эндпоинты требуют аутентификации
router.use(isAuthenticated);

// Получение посещаемости за месяц
router.get('/', getAttendanceByMonth);

// Создание записи о посещаемости
router.post('/', createAttendance);

// Обновление записи о посещаемости по ID
router.patch('/:id', updateAttendance);

// Массовое обновление посещаемости
router.post('/bulk', bulkUpdateAttendance);

export default router;