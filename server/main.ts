/**
 * Основной файл для запуска сервера приложения.
 * Инициализирует Express, настраивает маршруты и запускает HTTP сервер.
 */

import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import ViteAdapter from './utils/vite-adapter';
import corsMiddleware from './middleware/cors-middleware';
import diagnosticsRouter from './routes/diagnostics';

export async function createServer() {
  // Создаем экземпляр приложения Express
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  
  // Настройка хранилища сессий
  const MemoryStoreSession = MemoryStore(session);
  
  // Настраиваем middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(corsMiddleware);
  
  // Настройка сессий
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // Очистка устаревших сессий раз в 24 часа
    }),
    cookie: {
      maxAge: 86400000, // 24 часа
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  }));
  
  // Добавляем информацию о запросах в логи
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log(`Session ID: ${req.session.id}`);
    console.log(`Session: ${JSON.stringify(req.session)}`);
    
    // Проверка аутентификации без прямого доступа к user
    const isAuthenticated = req.session && 'user' in req.session;
    console.log(`Auth Status: ${isAuthenticated}`);
    
    next();
  });
  
  // Регистрируем диагностические маршруты
  app.use('/diagnostics', diagnosticsRouter);
  
  // Статические файлы для диагностики
  app.use('/static', express.static(path.join(process.cwd(), 'client/public')));
  
  // API маршрут для проверки статуса
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      message: 'API сервер работает корректно'
    });
  });
  
  // Инициализируем ViteAdapter для обработки клиентских запросов
  try {
    const viteAdapter = new ViteAdapter(app);
    await viteAdapter.initialize();
    console.log(`[express] Успешно инициализирован интерфейс через Vite адаптер`);
  } catch (error) {
    console.error(`[express] Ошибка инициализации Vite адаптера:`, error);
    
    // Запасной вариант - обслуживание статических файлов из public
    app.use(express.static(path.join(process.cwd(), 'client/public')));
    
    // Перенаправление на запасную страницу для всех клиентских маршрутов
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/diagnostics/')) {
        return next();
      }
      
      // Пытаемся отправить fallback.html
      const fallbackPath = path.join(process.cwd(), 'client/public/fallback.html');
      if (fs.existsSync(fallbackPath)) {
        return res.sendFile(fallbackPath);
      }
      
      // Если fallback.html не найден, отправляем простой HTML
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>СпортШкола CRM</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #0066ff; }
            .card { border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .btn { display: inline-block; background: #0066ff; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; margin-right: 10px; }
          </style>
        </head>
        <body>
          <h1>СпортШкола CRM</h1>
          <div class="card">
            <h2>Ошибка инициализации</h2>
            <p>К сожалению, возникла проблема при инициализации приложения.</p>
            <p>
              <a href="/diagnostics" class="btn">Перейти к диагностике</a>
            </p>
          </div>
        </body>
        </html>
      `);
    });
  }
  
  // Обработка ошибок
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });
  
  // Запускаем сервер с обработкой ошибок
  const startServer = (port: number) => {
    try {
      app.listen(port, '0.0.0.0', () => {
        console.log(`[express] serving on port ${port}`);
      });
    } catch (error) {
      console.error(`[express] Порт ${port} занят, пробуем следующий порт...`);
      startServer(port + 1);
    }
  };
  
  startServer(PORT);
  
  return app;
}