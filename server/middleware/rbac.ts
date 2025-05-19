import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@shared/schema';
import { ApiErrorClass } from './error';

// Определение типа разрешений
type Permission = 'viewStudents' | 'editStudents' | 'viewTrialRequests' | 'editTrialRequests' | 
                  'createTrialRequests' | 'viewPayments' | 'createPayments' | 'viewAttendance' | 
                  'editAttendance' | 'manageUsers' | 'manageGroups' | 'viewSettings' | 'editSettings';

// Карта разрешений для каждой роли
const permissionMap: Record<string, Permission[]> = {
  [UserRole.OWNER]: [
    'viewStudents', 'editStudents',
    'viewTrialRequests', 'editTrialRequests', 'createTrialRequests',
    'viewPayments', 'createPayments',
    'viewAttendance', 'editAttendance',
    'manageUsers', 'manageGroups',
    'viewSettings', 'editSettings'
  ],
  [UserRole.SENIOR_ADMIN]: [
    'viewStudents', 'editStudents',
    'viewTrialRequests', 'editTrialRequests', 'createTrialRequests',
    'viewPayments', 'createPayments',
    'viewAttendance', 'editAttendance',
    'manageUsers', 'manageGroups',
    'viewSettings', 'editSettings'
  ],
  [UserRole.ADMIN]: [
    'viewStudents', 'editStudents',
    'viewTrialRequests', 'editTrialRequests', 'createTrialRequests',
    'viewPayments', 'createPayments',
    'viewAttendance', 'editAttendance',
    'manageGroups',
    'viewSettings'
  ],
  [UserRole.TRAINER]: [
    'viewStudents',
    'viewTrialRequests',
    'viewAttendance', 'editAttendance'
  ]
};

/**
 * Проверяет, имеет ли пользователь необходимое разрешение
 */
export const hasPermission = (user: Express.User | undefined, permission: Permission): boolean => {
  if (!user || !user.role) {
    return false;
  }

  const role = user.role as string;
  const userPermissions = permissionMap[role] || [];
  
  return userPermissions.includes(permission);
};

/**
 * Middleware для проверки конкретного разрешения
 */
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (hasPermission(req.user, permission)) {
      return next();
    }
    
    throw new ApiErrorClass('Недостаточно прав для выполнения этого действия', 403);
  };
};

/**
 * Middleware для проверки роли пользователя
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiErrorClass('Требуется авторизация', 401);
    }
    
    const userRole = req.user.role;
    if (roles.includes(userRole)) {
      return next();
    }
    
    throw new ApiErrorClass('Недостаточно прав для выполнения этого действия', 403);
  };
};

// Готовые middleware для часто используемых проверок
export const isTrainer = requireRole([UserRole.OWNER, UserRole.SENIOR_ADMIN, UserRole.ADMIN, UserRole.TRAINER]);
export const isAdmin = requireRole([UserRole.OWNER, UserRole.SENIOR_ADMIN, UserRole.ADMIN]);
export const isSeniorAdmin = requireRole([UserRole.OWNER, UserRole.SENIOR_ADMIN]);
export const isOwner = requireRole([UserRole.OWNER]);