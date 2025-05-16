import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { TrialRequestController } from '../controllers/trialRequestController';
import { TrialRequestStatus } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Схема для обновления статуса заявки
const updateStatusSchema = z.object({
  status: z.enum([
    TrialRequestStatus.NEW,
    TrialRequestStatus.TRIAL_ASSIGNED,
    TrialRequestStatus.REFUSED,
    TrialRequestStatus.SIGNED,
  ]),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
  archived: z.boolean().optional(),
});

// Маршруты для работы с заявками на пробные занятия
router.get('/', isAuthenticated, TrialRequestController.getAllTrialRequests);
router.get('/:id', isAuthenticated, TrialRequestController.getTrialRequestById);

// Публичный маршрут для создания заявки (не требует авторизации)
router.post('/', 
  validateBody(TrialRequestController.validationSchemas.create), 
  TrialRequestController.createTrialRequest
);

// Обновление статуса заявки (требует авторизации)
router.patch('/:id/status', 
  isAuthenticated,
  validateParams(TrialRequestController.validationSchemas.params),
  validateBody(updateStatusSchema),
  TrialRequestController.updateTrialRequestStatus
);

// Полное обновление заявки (требует авторизации)
router.put('/:id', 
  isAuthenticated,
  validateParams(TrialRequestController.validationSchemas.params),
  validateBody(TrialRequestController.validationSchemas.update),
  TrialRequestController.updateTrialRequest
);

// Удаление заявки (требует авторизации)
router.delete('/:id', 
  isAuthenticated,
  validateParams(TrialRequestController.validationSchemas.params),
  TrialRequestController.deleteTrialRequest
);

export default router;
