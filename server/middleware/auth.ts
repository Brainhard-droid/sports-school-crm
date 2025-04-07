import { Request, Response, NextFunction } from 'express';
import { ApiErrorClass } from './error';

/**
 * Middleware для проверки аутентификации
 */
export const isAuthenticated = (req: Request, _res: Response, next: NextFunction) => {
  // Здесь должна быть реализация проверки аутентификации
  // Пока используем упрощенную проверку наличия пользователя в req.user
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // Проверяем наличие токена в режиме разработки
  if (process.env.NODE_ENV === 'development') {
    const devToken = req.headers['x-dev-token'];
    if (devToken === process.env.DEV_TOKEN) {
      return next();
    }
  }
  
  throw new ApiErrorClass('Требуется авторизация', 401);
};

/**
 * Middleware для проверки прав доступа
 */
export const hasRole = (requiredRole: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiErrorClass('Требуется авторизация', 401);
    }
    
    // Здесь должна быть логика проверки роли пользователя
    // Пока проверяем роль пользователя через req.user.role
    // @ts-ignore
    const userRole = req.user.role;
    
    if (userRole === requiredRole || userRole === 'admin') {
      return next();
    }
    
    throw new ApiErrorClass('Недостаточно прав для выполнения операции', 403);
  };
};