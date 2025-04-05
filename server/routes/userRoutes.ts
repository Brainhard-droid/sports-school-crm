import { Router } from 'express';
import { authRequired, validateRequest } from '../middleware/error';
import * as userController from '../controllers/userController';
import { insertUserSchema } from '@shared/schema';
import passport from 'passport';
import { z } from 'zod';

const router = Router();

// Схемы валидации
const loginSchema = z.object({
  username: z.string().min(1, 'Имя пользователя обязательно'),
  password: z.string().min(1, 'Пароль обязателен')
});

const passwordResetRequestSchema = z.object({
  email: z.string().email('Некорректный email')
});

const passwordResetSchema = z.object({
  token: z.string().min(1, 'Токен обязателен'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
  newPassword: z.string().min(6, 'Новый пароль должен содержать минимум 6 символов')
});

// Маршруты для работы с пользователями
router.get('/current', userController.getCurrentUser);

router.post('/login', 
  validateRequest(loginSchema),
  passport.authenticate('local'),
  userController.login
);

router.post('/register', 
  validateRequest(insertUserSchema),
  userController.register
);

router.post('/logout', authRequired, userController.logout);

router.post('/request-reset', 
  validateRequest(passwordResetRequestSchema),
  userController.requestPasswordReset
);

router.post('/reset-password', 
  validateRequest(passwordResetSchema),
  userController.resetPassword
);

router.put('/profile', 
  authRequired,
  userController.updateProfile
);

router.put('/change-password', 
  authRequired,
  validateRequest(changePasswordSchema),
  userController.changePassword
);

export default router;