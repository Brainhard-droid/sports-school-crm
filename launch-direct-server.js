/**
 * Модуль для запуска прямого сервера
 * 
 * Этот скрипт запускает direct-server.js в режиме воркера,
 * чтобы он работал параллельно с основным сервером.
 */

import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к скрипту прямого сервера
const serverScriptPath = path.join(__dirname, 'direct-server.js');

console.log(`Запуск прямого сервера из ${serverScriptPath}...`);

// Запускаем сервер в отдельном потоке
const worker = new Worker(serverScriptPath, {
  workerData: { port: 3333 }
});

// Обрабатываем сообщения от воркера
worker.on('message', (message) => {
  console.log(`[Прямой сервер] ${message}`);
});

// Обрабатываем ошибки
worker.on('error', (error) => {
  console.error(`[Прямой сервер] Ошибка: ${error.message}`);
});

// Обрабатываем завершение работы
worker.on('exit', (code) => {
  if (code !== 0) {
    console.error(`[Прямой сервер] Завершил работу с кодом ${code}`);
  } else {
    console.log('[Прямой сервер] Успешно завершил работу');
  }
});

console.log('[Основной процесс] Прямой сервер запущен в отдельном потоке');