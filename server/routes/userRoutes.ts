import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { UserController } from '../controllers/userController';
import passport from 'passport';

const router = Router();

// Маршруты для работы с пользователями
router.get('/current', UserController.getCurrentUser);

router.post('/login', 
  validateBody(UserController.validationSchemas.login),
  passport.authenticate('local'),
  UserController.login
);

router.post('/register', 
  validateBody(UserController.validationSchemas.create),
  UserController.register
);

router.post('/logout', isAuthenticated, UserController.logout);

router.post('/request-reset', 
  validateBody(UserController.validationSchemas.resetRequest),
  UserController.requestPasswordReset
);

router.post('/reset-password', 
  validateBody(UserController.validationSchemas.resetPassword),
  UserController.resetPassword
);

router.put('/profile', 
  isAuthenticated,
  validateBody(UserController.validationSchemas.updateProfile),
  UserController.updateProfile
);

router.put('/change-password', 
  isAuthenticated,
  validateBody(UserController.validationSchemas.changePassword),
  UserController.changePassword
);

export default router;
