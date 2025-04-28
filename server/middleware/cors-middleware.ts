/**
 * Middleware для обработки CORS в среде Replit
 * 
 * Этот модуль решает проблемы с CORS, которые могут возникать
 * при работе в Replit из-за использования различных доменов
 * и ограничений безопасности в браузере
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Проверяет, является ли host разрешенным для CORS
 */
function isAllowedHost(host: string): boolean {
  // Разрешаем localhost
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return true;
  }
  
  // Разрешаем домены Replit
  if (host.includes('.replit.dev') || 
      host.includes('.repl.co') || 
      host.includes('.repl.run') ||
      host.includes('.replit.app')) {
    return true;
  }
  
  // Разрешаем поддомены Replit, которые иногда генерируются динамически
  const replitDomains = ['.id.repl.co', '.repl.co', '.replit.dev', '.replit.app'];
  return replitDomains.some(domain => host.endsWith(domain));
}

/**
 * Расширенный CORS middleware с поддержкой различных хостов Replit
 */
export default function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Извлекаем origin из заголовка
  const origin = req.headers.origin || '';
  
  // Определяем referer из заголовка
  const referer = req.headers.referer || '';
  
  // Пытаемся извлечь domainName из referer или origin
  let domainName = '';
  
  try {
    if (referer) {
      const refererUrl = new URL(referer);
      domainName = refererUrl.host;
    } else if (origin) {
      const originUrl = new URL(origin);
      domainName = originUrl.host;
    }
  } catch (error) {
    console.error('Error parsing URL:', error);
  }
  
  // Устанавливаем нужные заголовки для CORS
  if (domainName && isAllowedHost(domainName)) {
    // Разрешаем доступ с указанного домена
    res.setHeader('Access-Control-Allow-Origin', `https://${domainName}`);
  } else {
    // Разрешаем доступ со всех доменов в режиме разработки
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // Разрешаем передачу учетных данных (cookies)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Разрешаем указанные методы
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  
  // Разрешаем указанные заголовки
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  
  // Если это preflight запрос, отвечаем сразу
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Продолжаем обработку запроса
  next();
}