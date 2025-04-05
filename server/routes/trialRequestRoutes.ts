import { Router } from 'express';
import { authRequired, validateRequest } from '../middleware/error';
import * as trialRequestController from '../controllers/trialRequestController';
import { insertTrialRequestSchema } from '@shared/schema';
import { z } from 'zod';
import { TrialRequestStatus } from '@shared/schema';

const router = Router();

// Схемы валидации
const updateStatusSchema = z.object({
  status: z.enum([
    TrialRequestStatus.NEW,
    TrialRequestStatus.TRIAL_ASSIGNED,
    TrialRequestStatus.REFUSED,
    TrialRequestStatus.SIGNED,
  ]),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
});

// Маршруты для работы с заявками на пробные занятия
router.get('/', authRequired, trialRequestController.getAllTrialRequests);
router.get('/:id', authRequired, trialRequestController.getTrialRequestById);

// Публичный маршрут для создания заявки (не требует авторизации)
router.post('/', 
  validateRequest(insertTrialRequestSchema.extend({ 
    consentToDataProcessing: z.boolean().refine(val => val === true, {
      message: 'Необходимо согласие на обработку персональных данных',
    }),
    parentEmail: z.string().email('Некорректный email')
  })),
  trialRequestController.createTrialRequest
);

// Обновление статуса заявки (требует авторизации)
router.patch('/:id/status', 
  authRequired,
  validateRequest(updateStatusSchema),
  trialRequestController.updateTrialRequestStatus
);

// Полное обновление заявки (требует авторизации)
router.put('/:id', 
  authRequired,
  trialRequestController.updateTrialRequest
);

// Удаление заявки (требует авторизации)
router.delete('/:id', 
  authRequired,
  trialRequestController.deleteTrialRequest
);

export default router;