/**
 * Диагностические маршруты для проверки работоспособности системы
 * 
 * Эти маршруты позволяют диагностировать различные аспекты приложения,
 * проверять доступность API, статических файлов и общее состояние системы.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';

const router = express.Router();

/**
 * Основной маршрут диагностики - показывает общую информацию
 */
router.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>СпортШкола CRM - Диагностика</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #0066ff; }
        .card { border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .btn { display: inline-block; background: #0066ff; color: white; padding: 10px 20px; 
              text-decoration: none; border-radius: 5px; margin-right: 10px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>СпортШкола CRM - Диагностический центр</h1>
      
      <div class="card">
        <h2>Проверки и инструменты</h2>
        <p>
          <a href="/diagnostics/api-check" class="btn">Проверка API</a>
          <a href="/diagnostics/static-check" class="btn">Проверка статических файлов</a>
          <a href="/diagnostics/env-check" class="btn">Переменные окружения</a>
          <a href="/diagnostics/system-info" class="btn">Информация о системе</a>
        </p>
      </div>
      
      <div class="card">
        <h2>Альтернативные страницы</h2>
        <p>Если основной интерфейс недоступен, вы можете использовать эти альтернативные страницы:</p>
        <p>
          <a href="/diagnostics/proxy" class="btn">Через прокси</a>
          <a href="/diagnostics/standalone" class="btn">Автономное приложение</a>
          <a href="/diagnostics/direct-client" class="btn">Прямой вход</a>
          <a href="/diagnostics/fallback" class="btn">Запасная страница</a>
        </p>
      </div>
    </body>
    </html>
  `);
});

/**
 * Проверка доступности API
 */
router.get('/api-check', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API работает корректно'
  });
});

/**
 * Проверка статических файлов
 */
router.get('/static-check', (req, res) => {
  const clientDir = path.join(process.cwd(), 'client');
  const publicDir = path.join(clientDir, 'public');
  
  const files: Record<string, boolean> = {};
  
  try {
    const publicFiles = fs.existsSync(publicDir) ? 
      fs.readdirSync(publicDir).filter(f => !f.startsWith('.')) : 
      [];
      
    // Проверяем наличие ключевых файлов
    ['direct-entry.html', 'fallback.html', 'standalone-app.html'].forEach(file => {
      const filePath = path.join(publicDir, file);
      files[file] = fs.existsSync(filePath);
    });
  
    res.json({
      status: 'ok',
      directories: {
        client: fs.existsSync(clientDir),
        public: fs.existsSync(publicDir)
      },
      publicFiles,
      keyFiles: files
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Проверка переменных окружения
 */
router.get('/env-check', (req, res) => {
  // Отправляем только безопасные переменные окружения
  res.json({
    status: 'ok',
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || '5000',
      HOST: process.env.HOST || '0.0.0.0'
    }
  });
});

/**
 * Информация о системе
 */
router.get('/system-info', (req, res) => {
  const formatMemory = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  res.json({
    status: 'ok',
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: formatMemory(os.totalmem()),
      freeMemory: formatMemory(os.freemem()),
      nodeVersion: process.version,
      uptime: Math.floor(os.uptime() / 60) + ' min'
    }
  });
});

// Маршрут для каждого HTML-файла
['proxy', 'standalone', 'direct-client', 'fallback'].forEach(routeName => {
  let fileName;
  
  switch (routeName) {
    case 'proxy':
      fileName = 'proxy.html';
      break;
    case 'standalone':
      fileName = 'standalone-app.html';
      break;
    case 'direct-client':
      fileName = 'direct-entry.html';
      break;
    case 'fallback':
      fileName = 'fallback.html';
      break;
    default:
      fileName = 'fallback.html';
  }
  
  router.get(`/${routeName}`, (req, res) => {
    const filePath = path.join(process.cwd(), 'client/public', fileName);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send(`Файл ${fileName} не найден`);
    }
  });
});

export default router;