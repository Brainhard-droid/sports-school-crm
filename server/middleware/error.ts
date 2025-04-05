import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

// Класс для создания стандартизированных API ошибок
export class ApiErrorClass extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Обертка для асинхронных обработчиков маршрутов
export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Промежуточное ПО для проверки авторизации
export const authRequired = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ 
    status: 'error',
    statusCode: 401, 
    message: 'Требуется авторизация' 
  });
};

// Промежуточное ПО для валидации запросов с использованием Zod схем
export const validateRequest = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Ошибка валидации данных',
        errors: error
      });
    }
  };
};

// Глобальный обработчик ошибок
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error details:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Внутренняя ошибка сервера';

  // Проверка ошибок валидации Drizzle/Zod
  if (err.name === 'ZodError' || err.code === 'P2025') {
    statusCode = 400;
    message = err.message || 'Ошибка валидации данных';
  }

  // Ошибки PostgreSQL
  if (err.code && err.code.startsWith('P')) {
    statusCode = 400;
    
    switch (err.code) {
      case 'P2002':
        message = 'Запись с такими данными уже существует';
        break;
      case 'P2025':
        message = 'Запись не найдена';
        break;
      default:
        message = 'Ошибка базы данных';
    }
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  });
};

// Обработчик 404 ошибок
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Маршрут ${req.originalUrl} не найден на сервере`
  });
};