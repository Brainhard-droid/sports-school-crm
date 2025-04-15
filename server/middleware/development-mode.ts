// Middleware для принудительного включения режима разработки
import { Request, Response, NextFunction } from 'express';

// Этот middleware устанавливает переменную окружения NODE_ENV в "development" 
// что обеспечивает правильную работу Vite в режиме разработки
export function developmentModeMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!process.env.NODE_ENV) {
    console.log("Устанавливаем NODE_ENV=development");
    process.env.NODE_ENV = "development";
  }
  
  // Добавляем заголовки для предотвращения кэширования при разработке
  if (process.env.NODE_ENV === "development") {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  
  next();
}