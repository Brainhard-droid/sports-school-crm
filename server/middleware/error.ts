import { Request, Response, NextFunction } from 'express';

/**
 * Класс для API ошибок
 * Позволяет стандартизировать обработку ошибок в контроллерах
 */
export class ApiErrorClass extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    
    // Правильная трассировка в TypeScript
    Object.setPrototypeOf(this, ApiErrorClass.prototype);
  }
}

/**
 * Обработчик ошибок для API
 * Форматирует и возвращает клиенту понятное сообщение об ошибке
 */
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', err);
  
  if (err instanceof ApiErrorClass) {
    return res.status(err.statusCode).json({ 
      message: err.message,
      success: false
    });
  }
  
  // Если ошибка не от API, возвращаем 500
  return res.status(500).json({ 
    message: 'Внутренняя ошибка сервера',
    success: false
  });
};

/**
 * Обертка для асинхронных обработчиков запросов
 * Автоматически отлавливает ошибки и передает их в middleware обработки ошибок
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};