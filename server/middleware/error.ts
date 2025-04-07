import { Request, Response, NextFunction } from 'express';

/**
 * Класс для обработки ошибок API
 */
export class ApiErrorClass extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiErrorClass.prototype);
  }
}

/**
 * Middleware для обработки асинхронных обработчиков маршрутов
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Middleware для обработки ошибок
 */
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  
  if (err instanceof ApiErrorClass) {
    return res.status(err.statusCode).json({
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
  
  // Обработка ошибок валидации Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      message: 'Ошибка валидации данных',
      errors: err,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
  
  // Общие ошибки
  res.status(500).json({
    message: err.message || 'Внутренняя ошибка сервера',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};