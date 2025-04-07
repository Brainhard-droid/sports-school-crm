import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

/**
 * Middleware для валидации тела запроса с использованием схемы Zod
 * 
 * @param schema Схема валидации
 * @returns Middleware функция
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }));
        
        return res.status(400).json({
          error: 'Validation Error',
          details: errors
        });
      }
      
      next(error);
    }
  };
}

/**
 * Middleware для валидации параметров запроса с использованием схемы Zod
 * 
 * @param schema Схема валидации
 * @returns Middleware функция
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }));
        
        return res.status(400).json({
          error: 'Validation Error',
          details: errors
        });
      }
      
      next(error);
    }
  };
}

/**
 * Middleware для валидации query-параметров с использованием схемы Zod
 * 
 * @param schema Схема валидации
 * @returns Middleware функция
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }));
        
        return res.status(400).json({
          error: 'Validation Error',
          details: errors
        });
      }
      
      next(error);
    }
  };
}