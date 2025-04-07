import { IBaseStorage } from './IBaseStorage';
import { IUserStorage } from './IUserStorage';
import { IBranchStorage } from './IBranchStorage';
import { ISectionStorage } from './ISectionStorage';
import { IBranchSectionStorage } from './IBranchSectionStorage';
import { ITrialRequestStorage } from './ITrialRequestStorage';
import { IStudentStorage } from './IStudentStorage';

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
  IStudentStorage {
  // Дополнительные методы, относящиеся к хранилищу в целом, можно добавить здесь
}

// Экспортируем все интерфейсы
export {
  IBaseStorage,
  IUserStorage,
  IBranchStorage,
  ISectionStorage,
  IBranchSectionStorage,
  ITrialRequestStorage,
  IStudentStorage
};