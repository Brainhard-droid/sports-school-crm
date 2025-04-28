/**
 * Адаптер для интеграции с Vite
 * 
 * Этот модуль обеспечивает интеграцию между Express и Vite,
 * не модифицируя напрямую конфигурацию Vite.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * Класс для интеграции с Vite
 * Предоставляет методы для обработки клиентских запросов через прокси
 */
export default class ViteAdapter {
  private app: Express;
  private viteInstance: any = null;
  private isProduction: boolean = process.env.NODE_ENV === 'production';
  private clientRoot: string = path.join(process.cwd(), 'client');
  
  constructor(app: Express) {
    this.app = app;
  }
  
  /**
   * Инициализирует интеграцию с Vite
   */
  async initialize(): Promise<void> {
    try {
      if (!this.isProduction) {
        // В режиме разработки используем динамический импорт для vite
        const { createServer } = await import('vite');
        
        this.viteInstance = await createServer({
          configFile: path.join(process.cwd(), 'vite.config.ts'),
          server: {
            middlewareMode: true
          }
        });
        
        // Используем vite middleware
        this.app.use(this.viteInstance.middlewares);
        
        // Добавляем middleware для обработки клиентских маршрутов
        this.app.use(this.handleDevRequest.bind(this));
      } else {
        // В production режиме обслуживаем статические файлы
        const distPath = path.join(this.clientRoot, 'dist');
        this.app.use(express.static(distPath));
        
        // Добавляем middleware для отправки index.html
        this.app.use(this.handleProdRequest.bind(this));
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('ViteAdapter init error:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Обрабатывает запросы в режиме разработки
   */
  private async handleDevRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Пропускаем API запросы
      if (req.path.startsWith('/api/') || req.path.startsWith('/diagnostics/')) {
        return next();
      }
      
      // Путь к клиентскому index.html
      const indexPath = path.join(this.clientRoot, 'index.html');
      
      // Проверяем наличие файла
      if (!fs.existsSync(indexPath)) {
        console.warn(`ViteAdapter: index.html не найден в ${indexPath}`);
        return next();
      }
      
      // Читаем содержимое index.html
      let html = fs.readFileSync(indexPath, 'utf-8');
      
      // Трансформируем HTML через Vite
      html = await this.viteInstance.transformIndexHtml(req.url, html);
      
      // Отправляем HTML клиенту
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
      console.error('ViteAdapter Dev Request error:', error);
      next(error);
    }
  }
  
  /**
   * Обрабатывает запросы в production режиме
   */
  private handleProdRequest(req: Request, res: Response, next: NextFunction): void {
    try {
      // Пропускаем API запросы
      if (req.path.startsWith('/api/') || req.path.startsWith('/diagnostics/')) {
        return next();
      }
      
      // Путь к production index.html
      const indexPath = path.join(this.clientRoot, 'dist', 'index.html');
      
      // Отправляем HTML клиенту
      res.sendFile(indexPath);
    } catch (error) {
      console.error('ViteAdapter Prod Request error:', error);
      next(error);
    }
  }
}