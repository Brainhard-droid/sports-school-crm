import { Request, Response, NextFunction } from 'express';

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