import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiErrorClass } from './error';

type ValidationSchema = {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
};

/**
 * Middleware для валидации запросов с использованием Zod
 * @param schema Схемы валидации для разных частей запроса
 */
export const validateRequest = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Валидация тела запроса
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Валидация параметров URL
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      // Валидация query-параметров
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          message: 'Ошибка валидации данных',
          errors: formattedErrors
        });
      }
      
      next(new ApiErrorClass('Ошибка валидации', 400));
    }
  };
};

/**
 * Middleware для валидации тела запроса
 * @param schema Zod схема для валидации
 */
export const validateBody = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          message: 'Ошибка валидации тела запроса',
          errors: formattedErrors
        });
      }
      
      next(new ApiErrorClass('Ошибка валидации', 400));
    }
  };
};

/**
 * Middleware для валидации параметров URL
 * @param schema Zod схема для валидации
 */
export const validateParams = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          message: 'Ошибка валидации параметров URL',
          errors: formattedErrors
        });
      }
      
      next(new ApiErrorClass('Ошибка валидации', 400));
    }
  };
};

/**
 * Middleware для валидации query-параметров
 * @param schema Zod схема для валидации
 */
export const validateQuery = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          message: 'Ошибка валидации query-параметров',
          errors: formattedErrors
        });
      }
      
      next(new ApiErrorClass('Ошибка валидации', 400));
    }
  };
};