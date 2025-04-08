import { Router } from 'express';
import { getDateComments, createDateComment, updateDateComment, deleteDateComment } from '../controllers/dateCommentController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Все маршруты требуют аутентификации
router.use(isAuthenticated);

// Получение комментариев для группы по месяцу
router.get('/', getDateComments);

// Создание нового комментария
router.post('/', createDateComment);

// Обновление существующего комментария
router.patch('/:id', updateDateComment);

// Удаление комментария
router.delete('/:id', deleteDateComment);

export default router;