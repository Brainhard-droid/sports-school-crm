import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiErrorClass } from './error';

/**
 * Middleware для валидации тела запроса с помощью Zod
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      // Заменяем req.body на валидированные данные
      req.body = result;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware для валидации query-параметров с помощью Zod
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.query);
      // Заменяем req.query на валидированные данные
      req.query = result;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware для валидации параметров маршрута с помощью Zod
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.params);
      // Заменяем req.params на валидированные данные
      req.params = result;
      next();
    } catch (error) {
      next(error);
    }
  };
};