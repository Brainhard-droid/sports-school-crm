/**
 * @fileoverview Основной файл хранилища данных
 * 
 * Этот файл является точкой входа для хранилища данных.
 * Он экспортирует глобальный экземпляр PostgresStorage из папки ./storage/
 */

// Экспортируем хранилище из обновленной структуры
import { storage } from './storage/index';
// Также экспортируем тип IStorage для обратной совместимости
// Определяем тип IStorage прямо здесь, используя тип хранилища
import type { PostgresStorage } from './storage/index';
export type IStorage = PostgresStorage;

export { storage };
