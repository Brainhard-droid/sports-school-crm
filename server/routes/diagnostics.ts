/**
 * Диагностические маршруты для проверки состояния приложения
 * Следуя принципу единственной ответственности (SOLID)
 */
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Эмуляция __dirname для ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const diagnosticsRouter = Router();

// Маршрут для проверки API
diagnosticsRouter.get('/api-check', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API работает корректно'
  });
});

// Маршрут для проверки состояния сессии
diagnosticsRouter.get('/session-check', (req, res) => {
  res.json({
    status: 'ok',
    sessionId: req.sessionID,
    authenticated: req.isAuthenticated(),
    sessionData: req.session
  });
});

// Маршрут для просмотра переменных окружения (только в режиме разработки)
diagnosticsRouter.get('/env-check', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    // В режиме разработки показываем ограниченный набор переменных
    const safeEnv = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      VITE_HOST: process.env.VITE_HOST,
      VITE_PORT: process.env.VITE_PORT,
      VITE_FORCE_ALLOW_HOSTS: process.env.VITE_FORCE_ALLOW_HOSTS,
      // Другие безопасные переменные...
    };
    
    res.json({
      status: 'ok',
      env: safeEnv
    });
  } else {
    res.status(403).json({
      status: 'error',
      message: 'Этот эндпоинт недоступен в режиме production'
    });
  }
});

// Маршрут для проверки статических файлов
diagnosticsRouter.get('/static-check', (req, res) => {
  const clientDir = path.resolve(__dirname, '../../client');
  const publicDir = path.join(clientDir, 'public');
  
  // Проверяем наличие каталогов
  const results = {
    status: 'ok',
    directories: {
      client: fs.existsSync(clientDir),
      public: fs.existsSync(publicDir)
    },
    files: {} as Record<string, boolean>
  };
  
  // Проверяем наличие критически важных файлов
  const criticalFiles = [
    path.join(clientDir, 'index.html'),
    path.join(publicDir, 'fallback.html')
  ];
  
  criticalFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    results.files[fileName] = fs.existsSync(filePath);
  });
  
  res.json(results);
});

// Маршрут для прямой доставки клиентского приложения (обходное решение для Vite)
diagnosticsRouter.get('/direct-client', (req, res) => {
  const indexPath = path.resolve(__dirname, '../../client/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Файл не найден: client/index.html');
  }
});

// Маршрут для запасной страницы
diagnosticsRouter.get('/fallback', (req, res) => {
  const fallbackPath = path.resolve(__dirname, '../../client/public/fallback.html');
  
  if (fs.existsSync(fallbackPath)) {
    res.sendFile(fallbackPath);
  } else {
    res.status(404).send('Файл запасной страницы не найден');
  }
});

// Маршрут для страницы с инструкциями
diagnosticsRouter.get('/manual', (req, res) => {
  const manualPath = path.resolve(__dirname, '../../client/public/index-manual.html');
  
  if (fs.existsSync(manualPath)) {
    res.sendFile(manualPath);
  } else {
    res.status(404).send('Страница с инструкциями не найдена');
  }
});

// Маршрут для прокси-страницы (основное решение проблемы)
diagnosticsRouter.get('/proxy', (req, res) => {
  const proxyPath = path.resolve(__dirname, '../../client/public/proxy.html');
  
  if (fs.existsSync(proxyPath)) {
    res.sendFile(proxyPath);
  } else {
    res.status(404).send('Прокси-страница не найдена');
  }
});

// Маршрут для автономной версии приложения (решение для обхода Vite)
diagnosticsRouter.get('/standalone', (req, res) => {
  const standalonePath = path.resolve(__dirname, '../../client/public/standalone-app.html');
  
  if (fs.existsSync(standalonePath)) {
    res.sendFile(standalonePath);
  } else {
    res.status(404).send('Автономная версия приложения не найдена');
  }
});

// Маршрут для перенаправления на прокси-страницу
diagnosticsRouter.get('/', (req, res) => {
  res.redirect('/diagnostics/proxy');
});

export default diagnosticsRouter;