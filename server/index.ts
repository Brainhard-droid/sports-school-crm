/**
 * Точка входа в приложение
 * Инициализирует WebSocket сервер и запускает Express сервер
 */

import { createServer } from './main';
import { WebSocketServer } from 'ws';

// Настройка WebSocket сервера для обновлений в реальном времени
const wss = new WebSocketServer({ port: 0 });

wss.on('connection', (ws) => {
  console.log('WebSocket клиент подключился');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`Получено сообщение: ${JSON.stringify(data)}`);
      
      // Обработка различных типов сообщений
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', time: new Date().toISOString() }));
      }
    } catch (error) {
      console.error('Ошибка обработки WebSocket сообщения:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket клиент отключился');
  });
  
  // Отправка приветственного сообщения
  ws.send(JSON.stringify({ 
    type: 'welcome', 
    message: 'Соединение с сервером установлено',
    time: new Date().toISOString()
  }));
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

console.log('WebSocket сервер успешно создан');

// Запускаем прямой сервер в отдельном процессе
import { spawn } from 'child_process';
import { join } from 'path';

// Путь к скрипту запуска прямого сервера
const directServerLauncherPath = join(process.cwd(), 'launch-direct-server.js');

// Запускаем прямой сервер
try {
  const directServerProcess = spawn('node', [directServerLauncherPath], {
    detached: true, // Процесс будет работать независимо от родительского
    stdio: 'inherit' // Вывод будет перенаправлен в консоль родительского процесса
  });
  
  // Отсоединяем процесс, чтобы он продолжал работать независимо
  directServerProcess.unref();
  
  console.log('Прямой сервер запущен в отдельном процессе');
} catch (error) {
  console.error('Ошибка при запуске прямого сервера:', error);
}

// Запускаем Express сервер
createServer().catch((err) => {
  console.error('Ошибка при запуске сервера:', err);
  process.exit(1);
});