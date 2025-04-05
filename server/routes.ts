import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import apiRouter from "./routes/index";
import { WebSocketServer } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  // Настройка аутентификации
  setupAuth(app);
  
  // Регистрация API маршрутов
  app.use('/api', apiRouter);
  
  // Создание HTTP сервера
  const server = createServer(app);
  
  // Настройка WebSocket сервера
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  // Обработка WebSocket соединений
  wss.on('connection', (socket) => {
    console.log('WebSocket client connected');
    
    socket.on('message', (message) => {
      console.log('Received message:', message.toString());
      // Обработка сообщений
    });
    
    socket.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  return server;
}
