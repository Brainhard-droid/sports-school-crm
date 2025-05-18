import express from 'express';
import { UserController } from '../controllers/userController';
import { isOwner, isAdminOrHigher, populateUserPermissions } from '../middleware/permissions';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Применяем middleware для заполнения прав
router.use(populateUserPermissions);

// Получение всех пользователей (только владелец)
router.get(
  '/',
  isOwner,
  UserController.getAllUsers
);

// Получение пользователей с определенной ролью (только владелец)
router.get(
  '/role/:role',
  isOwner,
  UserController.getUsersByRole
);

// Обновление роли пользователя (только владелец)
router.patch(
  '/:id/role',
  isOwner,
  validateRequest({ body: UserController.validationSchemas.updateRole }),
  UserController.updateUserRole
);

// Получение групп, доступных пользователю (администратор и выше)
router.get(
  '/:id/groups',
  isAdminOrHigher,
  UserController.getUserGroups
);

// Назначение группы пользователю (только владелец)
router.post(
  '/assign-group',
  isOwner,
  validateRequest({ body: UserController.validationSchemas.assignGroup }),
  UserController.assignGroupToUser
);

// Удаление группы у пользователя (только владелец)
router.delete(
  '/:userId/groups/:groupId',
  isOwner,
  UserController.removeGroupFromUser
);

export default router;