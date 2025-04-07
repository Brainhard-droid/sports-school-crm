import { Request, Response, NextFunction } from 'express';

/**
 * Middleware для проверки аутентификации пользователя
 * 
 * @param req Объект запроса
 * @param res Объект ответа
 * @param next Функция для перехода к следующему middleware
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/**
 * Middleware для проверки роли пользователя
 * 
 * @param allowedRoles Массив разрешенных ролей
 * @returns Middleware функция
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // @ts-ignore - предполагается, что у пользователя есть поле role
    const userRole = req.user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have permission to access this resource' 
      });
    }
    
    next();
  };
}