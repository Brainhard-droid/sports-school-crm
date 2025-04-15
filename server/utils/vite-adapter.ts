/**
 * Адаптер для обеспечения надежной работы Vite
 * Создан в соответствии с принципом подстановки Лисков, чтобы обеспечить
 * совместимость с существующей инфраструктурой
 */
import { Server } from 'http';
import { Express } from 'express';
import path from 'path';
import fs from 'fs';
import { setupVite, serveStatic, log } from '../vite';

/**
 * Инициализирует Vite с дополнительной обработкой ошибок
 */
export async function initializeViteWithFallback(app: Express, server: Server): Promise<void> {
  try {
    console.log('Инициализация Vite с дополнительной защитой от ошибок');
    
    // Принудительно устанавливаем переменную окружения NODE_ENV
    process.env.NODE_ENV = "development";
    
    // Вызываем стандартный setupVite
    await setupVite(app, server);
    
    console.log('Vite успешно инициализирован');
  } catch (error) {
    console.error('Ошибка при инициализации Vite:', error);
    console.log('Переход в резервный режим - используем статические файлы, если они есть');
    
    try {
      // Пытаемся использовать статические файлы, если Vite не инициализировался
      serveStatic(app);
      console.log('Использование статических файлов в качестве запасного варианта');
    } catch (staticError) {
      console.error('Ошибка при использовании статических файлов:', staticError);
      
      // Fallback для HTML
      app.get('*', (req, res) => {
        const clientTemplate = path.resolve(
          __dirname,
          "../..",
          "client",
          "index.html"
        );
        
        if (fs.existsSync(clientTemplate)) {
          const html = fs.readFileSync(clientTemplate, 'utf-8');
          res.status(200).set({ "Content-Type": "text/html" }).send(html);
        } else {
          res.status(500).send('Ошибка загрузки приложения. Проверьте консоль сервера.');
        }
      });
    }
  }
}