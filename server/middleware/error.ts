import { Request, Response, NextFunction } from 'express';

/**
 * Класс для API ошибок с различными HTTP статусами
 */
export class ApiErrorClass extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
  
  static badRequest(message: string = 'Bad Request'): ApiErrorClass {
    return new ApiErrorClass(message, 400);
  }
  
  static unauthorized(message: string = 'Unauthorized'): ApiErrorClass {
    return new ApiErrorClass(message, 401);
  }
  
  static forbidden(message: string = 'Forbidden'): ApiErrorClass {
    return new ApiErrorClass(message, 403);
  }
  
  static notFound(message: string = 'Not Found'): ApiErrorClass {
    return new ApiErrorClass(message, 404);
  }
  
  static internalError(message: string = 'Internal Server Error'): ApiErrorClass {
    return new ApiErrorClass(message, 500);
  }
}

/**
 * Обёртка для асинхронных обработчиков, автоматически обрабатывающая ошибки
 * 
 * @param fn Асинхронная функция обработчика
 * @returns Функция-обработчик с обработкой ошибок
 */
export function asyncHandler(fn: Function) {
  return function(req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Глобальный обработчик ошибок
 * 
 * @param err Объект ошибки
 * @param req Объект запроса
 * @param res Объект ответа
 * @param next Функция для перехода к следующему middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[ERROR] ${err.stack || err.message}`);
  
  if (err instanceof ApiErrorClass) {
    return res.status(err.status).json({
      error: err.name,
      message: err.message
    });
  }
  
  // Проверяем тип ошибки и возвращаем соответствующий статус
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
  }
  
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to access this resource'
    });
  }
  
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message || 'Resource not found'
    });
  }
  
  // В случае неизвестной ошибки возвращаем 500
  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
}