/**
 * Адаптер для Vite, соблюдающий принцип Single Responsibility
 * и Open/Closed Principle из SOLID
 */
import express, { Express } from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Server } from 'http';
import viteConfig from '../../vite.config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Адаптер для инициализации Vite с запасными вариантами в случае ошибки
 */
export async function initializeViteWithFallback(app: Express, server: Server): Promise<void> {
  // Принудительно устанавливаем режим разработки для Vite
  process.env.NODE_ENV = 'development';
  console.log('ViteAdapter: Устанавливаем режим разработки');
  
  try {
    // Настраиваем Vite в режиме разработки
    console.log('ViteAdapter: Пытаемся инициализировать Vite');
    await setupViteDev(app, server);
    console.log('ViteAdapter: Vite успешно инициализирован');
  } catch (error) {
    console.error('ViteAdapter: Ошибка инициализации Vite:', error);
    setupFallbackMode(app);
  }
}

/**
 * Настройка Vite в режиме разработки
 */
async function setupViteDev(app: Express, server: Server): Promise<void> {
  // Создаем сервер Vite с правильной типизацией и расширенной конфигурацией
  const vite = await createViteServer({
    configFile: false,
    server: {
      middlewareMode: true,
      hmr: { 
        server,
        overlay: true,
        // Разрешаем подключение с любого хоста
        host: '0.0.0.0',
        port: 24678,
        clientPort: 24678
      },
      watch: {
        usePolling: true
      },
      // Важно! Разрешаем все хосты для Replit и преодолеваем ограничения CORS
      host: '0.0.0.0',
      fs: {
        strict: false,
        allow: ['.']
      },
      cors: true,
      // Разрешаем все хосты, что решает проблему в средах Replit
      origin: '*'
    },
    appType: 'custom',
    // Убеждаемся, что мы в режиме разработки
    mode: 'development',
    // Улучшаем кэширование и оптимизацию
    optimizeDeps: {
      force: true,
      esbuildOptions: {
        // Улучшаем совместимость
        target: 'es2020'
      }
    }
  });

  // Добавляем middleware Vite
  app.use(vite.middlewares);
  
  // Наш кастомный middleware для обработки index.html
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    
    // Не обрабатываем API запросы
    if (url.startsWith('/api/')) {
      return next();
    }
    
    try {
      // Читаем index.html
      const templatePath = path.resolve(__dirname, '../../client/index.html');
      let template = fs.readFileSync(templatePath, 'utf-8');
      
      // Позволяем Vite преобразовать шаблон с подстановкой значений HMR, переменных окружения
      template = await vite.transformIndexHtml(url, template);
      
      // Отправляем преобразованный HTML
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (error) {
      // Обрабатываем ошибки
      console.error('ViteAdapter: Ошибка при обработке HTML:', error);
      
      // Отправляем запасную страницу в случае ошибки
      const fallbackPath = path.resolve(__dirname, '../../client/public/fallback.html');
      if (fs.existsSync(fallbackPath)) {
        const fallbackHtml = fs.readFileSync(fallbackPath, 'utf-8');
        return res.status(500).set({ 'Content-Type': 'text/html' }).end(fallbackHtml);
      }
      
      // Если запасной страницы нет, передаем ошибку обработчику
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
}

/**
 * Настройка запасного режима (когда Vite не работает)
 */
function setupFallbackMode(app: Express): void {
  console.log('ViteAdapter: Активируем запасной режим');
  
  // Обслуживаем статические файлы из public
  const publicPath = path.resolve(__dirname, '../../client/public');
  app.use(express.static(publicPath));
  
  // Обрабатываем все запросы HTML с запасной страницей
  app.use('*', (req, res, next) => {
    // Если это API, просто пропускаем
    if (req.originalUrl.startsWith('/api/')) {
      return next();
    }
    
    const fallbackPath = path.resolve(__dirname, '../../client/public/fallback.html');
    if (fs.existsSync(fallbackPath)) {
      // Отправляем запасную HTML страницу
      return res.sendFile(fallbackPath);
    }
    
    // Если запасной страницы нет, отправляем простой текст
    res.status(500).send('Приложение временно недоступно. Пожалуйста, попробуйте позже.');
  });
}