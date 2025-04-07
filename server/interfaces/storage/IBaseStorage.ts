import { Store } from "express-session";

/**
 * Базовый интерфейс для хранилища данных
 * Содержит общие функции и свойства, которые должны быть у всех хранилищ
 */
export interface IBaseStorage {
  /** Хранилище сессий для express-session */
  sessionStore: Store;
}