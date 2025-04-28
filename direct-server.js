/**
 * Прямой сервер без Vite
 * 
 * Этот сервер запускается отдельно и обслуживает статические файлы
 * без использования Vite. Это позволяет обойти ограничения Vite,
 * которые могут возникать в Replit.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { isMainThread, parentPort, workerData } from 'worker_threads';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = workerData?.port || 3333;

// Функция для отправки сообщений из воркера
function sendMessageToParent(message) {
  if (!isMainThread && parentPort) {
    parentPort.postMessage(message);
  } else {
    console.log(message);
  }
}

// Настройка middleware для логирования
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Настройка CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Обслуживание статических файлов из client/public
app.use(express.static(path.join(__dirname, 'client/public')));

// API маршрут для проверки статуса
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    server: 'direct-server',
    port: PORT,
    message: 'Прямой сервер работает корректно'
  });
});

// Маршрут для получения информации о системе
app.get('/api/system-info', (req, res) => {
  const formatMemory = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  res.json({
    status: 'ok',
    system: {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      uptime: Math.floor(process.uptime() / 60) + ' min',
      memory: {
        total: formatMemory(process.memoryUsage().heapTotal),
        used: formatMemory(process.memoryUsage().heapUsed)
      }
    }
  });
});

// Маршрут для всех остальных запросов
app.get('*', (req, res) => {
  // Проверяем наличие запасной страницы
  const fallbackPath = path.join(__dirname, 'client/public/fallback.html');
  
  if (fs.existsSync(fallbackPath)) {
    return res.sendFile(fallbackPath);
  }
  
  // Если запасной страницы нет, отправляем простую HTML страницу
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>СпортШкола CRM - Прямой сервер</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #0066ff; }
        .card { border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .btn { display: inline-block; background: #0066ff; color: white; padding: 10px 20px; 
                text-decoration: none; border-radius: 5px; margin-right: 10px; }
      </style>
    </head>
    <body>
      <h1>СпортШкола CRM - Прямой сервер</h1>
      <div class="card">
        <h2>Информация о сервере</h2>
        <p>Сервер работает на порту ${PORT}.</p>
        <p>
          <a href="/api/status" class="btn">Статус сервера</a>
          <a href="/api/system-info" class="btn">Информация о системе</a>
        </p>
      </div>
    </body>
    </html>
  `);
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  const message = `Прямой сервер запущен на порту ${PORT}`;
  sendMessageToParent(message);
  console.log(message);
});