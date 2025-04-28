// Простой сервер без Vite для обхода проблем с доступом в Replit
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Получение пути к директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3333; // Используем другой порт, чтобы избежать конфликтов

// Базовые middleware
app.use(express.json());
app.use(express.static(join(__dirname, '../client/public')));

// CORS для всех запросов
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Статический контент
app.use('/static', express.static(join(__dirname, '../client/public')));

// API маршрут для проверки работоспособности
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Сервер работает',
    time: new Date().toISOString()
  });
});

// Маршрут для отображения содержимого директории (для диагностики)
app.get('/api/files', (req, res) => {
  const publicDir = join(__dirname, '../client/public');
  
  try {
    const files = fs.readdirSync(publicDir);
    res.json({
      directory: publicDir,
      files: files
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка чтения директории',
      message: error.message
    });
  }
});

// Маршрут для доступа к файлам HTML
app.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = join(__dirname, '../client/public', `${filename}.html`);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send(`Файл ${filename}.html не найден`);
  }
});

// Основной маршрут - отправка простой HTML-страницы
app.get('/', (req, res) => {
  const htmlPath = join(__dirname, '../client/public/fallback.html');
  
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
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
          <h2>Страницы системы</h2>
          <p>Используйте эти ссылки для доступа к различным частям системы:</p>
          <p>
            <a href="/direct-entry" class="btn">Страница входа</a>
            <a href="/standalone-app" class="btn">Автономная версия</a>
            <a href="/fallback" class="btn">Запасная страница</a>
          </p>
        </div>
        <div class="card">
          <h2>Диагностика</h2>
          <p>Используйте эти ссылки для проверки работоспособности системы:</p>
          <p>
            <a href="/api/status" class="btn">Проверка API</a>
            <a href="/api/files" class="btn">Проверка файлов</a>
          </p>
        </div>
      </body>
      </html>
    `);
  }
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ==============================================
  🚀 Прямой сервер запущен на порту ${PORT}
  
  Доступ к системе:
  http://localhost:${PORT}/
  
  Альтернативные точки входа:
  - http://localhost:${PORT}/direct-entry (Страница входа)
  - http://localhost:${PORT}/standalone-app (Автономное приложение)
  - http://localhost:${PORT}/fallback (Запасная страница)
  ==============================================
  `);
});