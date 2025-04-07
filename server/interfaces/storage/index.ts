/**
 * @fileoverview Главный файл экспорта интерфейсов хранилища
 * 
 * Этот файл экспортирует все интерфейсы хранилища данных.
 */

// Импорт отдельных интерфейсов
import { IBaseStorage } from './IBaseStorage';
import { IUserStorage } from './IUserStorage';
import { IBranchStorage } from './IBranchStorage';
import { ISectionStorage } from './ISectionStorage';
import { IBranchSectionStorage } from './IBranchSectionStorage';
import { ITrialRequestStorage } from './ITrialRequestStorage';
import { IStudentStorage } from './IStudentStorage';
import { IGroupStorage } from './IGroupStorage';
import { IStudentGroupStorage } from './IStudentGroupStorage';

/**
 * Полный интерфейс хранилища данных
 * Объединяет все интерфейсы хранилищ для различных сущностей
 */
export interface IStorage extends 
  IBaseStorage,
  IUserStorage, 
  IBranchStorage, 
  ISectionStorage,
  IBranchSectionStorage,
  ITrialRequestStorage,
  IStudentStorage,
  IGroupStorage,
  IStudentGroupStorage {
  // Дополнительные методы, относящиеся к хранилищу в целом, можно добавить здесь
}

// Экспорт отдельных интерфейсов для использования в реализациях
export * from './IBaseStorage';
export * from './IUserStorage';
export * from './IBranchStorage';
export * from './ISectionStorage';
export * from './IBranchSectionStorage';
export * from './ITrialRequestStorage';
export * from './IStudentStorage';
export * from './IGroupStorage';
export * from './IStudentGroupStorage';