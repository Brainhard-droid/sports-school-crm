/**
 * Middleware для настройки CORS политики
 * Следует принципам SOLID: Single Responsibility
 */
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware для настройки CORS с разрешением всех хостов
 * @param req HTTP запрос
 * @param res HTTP ответ
 * @param next Функция для передачи управления следующему middleware
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Получаем origin из заголовков
  const origin = req.headers.origin;
  
  // Устанавливаем заголовки CORS
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-CSRF-Token');
  
  // Для OPTIONS запросов сразу отвечаем успехом
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}