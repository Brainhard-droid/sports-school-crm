import { Request, Response, NextFunction } from 'express';
import { ApiErrorClass } from './error';

/**
 * Middleware для проверки аутентификации пользователя
 */
export const isAuthenticated = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    throw new ApiErrorClass('Требуется авторизация', 401);
  }
  next();
};