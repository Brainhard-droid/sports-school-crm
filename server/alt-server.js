/**
 * Альтернативный сервер без использования Vite
 * Это решение обходит проблемы с блокировкой хостов в Replit
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Добавляем middleware для обработки JSON и form данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настраиваем CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Статические файлы из директории public
app.use(express.static(path.join(__dirname, '../client/public')));

// Диагностические маршруты
const diagnosticsRouter = express.Router();

// API статус
diagnosticsRouter.get('/api-check', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API работает корректно'
  });
});

// Переменные окружения
diagnosticsRouter.get('/env-check', (req, res) => {
  res.json({
    status: 'ok',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: port
    }
  });
});

// Проверка файловой системы
diagnosticsRouter.get('/static-check', (req, res) => {
  const clientDir = path.join(__dirname, '../client');
  const publicDir = path.join(clientDir, 'public');
  
  const files = {};
  
  ['direct-entry.html', 'fallback.html', 'proxy.html', 'standalone-app.html'].forEach(file => {
    const filePath = path.join(publicDir, file);
    files[file] = fs.existsSync(filePath);
  });
  
  res.json({
    status: 'ok',
    directories: {
      client: fs.existsSync(clientDir),
      public: fs.existsSync(publicDir)
    },
    files
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
      fileName = 'direct-entry.html'; // Использовать нашу новую страницу входа
      break;
    case 'fallback':
      fileName = 'fallback.html';
      break;
    default:
      fileName = 'fallback.html';
  }
  
  diagnosticsRouter.get(`/${routeName}`, (req, res) => {
    res.sendFile(path.join(__dirname, `../client/public/${fileName}`));
  });
});

// Корневой маршрут диагностики перенаправляет на прямую страницу входа
diagnosticsRouter.get('/', (req, res) => {
  res.redirect('/diagnostics/direct-client');
});

// Регистрируем диагностический маршрутизатор
app.use('/diagnostics', diagnosticsRouter);

// API маршруты - заглушки для демонстрации
app.get('/api/sports-sections', (req, res) => {
  res.json([
    { id: 1, name: 'Футбол', description: 'Футбольная секция для детей 5-16 лет', minAge: 5, maxAge: 16 },
    { id: 2, name: 'Баскетбол', description: 'Баскетбольная секция для детей 7-17 лет', minAge: 7, maxAge: 17 },
    { id: 3, name: 'Плавание', description: 'Секция плавания для детей от 3 лет', minAge: 3, maxAge: 18 },
    { id: 4, name: 'Гимнастика', description: 'Гимнастика для детей 4-12 лет', minAge: 4, maxAge: 12 },
    { id: 5, name: 'Единоборства', description: 'Различные виды единоборств для детей от 6 лет', minAge: 6, maxAge: 18 }
  ]);
});

app.get('/api/branches', (req, res) => {
  res.json([
    { id: 1, name: 'Главный филиал', address: 'ул. Ленина, 123', phone: '+7 (123) 456-7890' },
    { id: 2, name: 'Северный филиал', address: 'ул. Северная, 45', phone: '+7 (123) 456-7891' },
    { id: 3, name: 'Центральный филиал', address: 'ул. Центральная, 78', phone: '+7 (123) 456-7892' }
  ]);
});

app.get('/api/branches-by-section', (req, res) => {
  const sectionId = parseInt(req.query.sectionId);
  
  if (!sectionId) {
    return res.status(400).json({ error: 'Missing sectionId parameter' });
  }
  
  // Заглушка для демонстрации
  res.json([
    { id: 1, name: 'Главный филиал', address: 'ул. Ленина, 123', schedule: 'Пн, Ср, Пт 16:00-19:00' },
    { id: 2, name: 'Северный филиал', address: 'ул. Северная, 45', schedule: 'Вт, Чт 17:00-20:00, Сб 10:00-13:00' }
  ]);
});

app.post('/api/trial-requests', (req, res) => {
  console.log('Received trial request:', req.body);
  res.status(201).json({ success: true, message: 'Заявка успешно создана' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Примитивная проверка для демонстрации
  if (email === 'admin@example.com' && password === 'admin') {
    res.json({ success: true, user: { id: 1, name: 'Admin', email, role: 'admin' } });
  } else if (email === 'user@example.com' && password === 'user') {
    res.json({ success: true, user: { id: 2, name: 'User', email, role: 'user' } });
  } else {
    res.status(401).json({ error: 'Неверный email или пароль' });
  }
});

// Корневой маршрут перенаправляет на диагностический центр
app.get('/', (req, res) => {
  res.redirect('/diagnostics/direct-client');
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Запуск сервера
app.listen(port, '0.0.0.0', () => {
  console.log(`Альтернативный сервер запущен на порту ${port}`);
  console.log(`Откройте http://localhost:${port}/diagnostics для доступа к системе`);
});