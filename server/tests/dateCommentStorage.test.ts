import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { DateCommentStorage } from '../storage/DateCommentStorage';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';

// Мокаем базу данных
jest.mock('../db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn()
  }
}));

describe('DateCommentStorage', () => {
  let dateCommentStorage: DateCommentStorage;
  const mockDateComment = {
    id: 1,
    groupId: 123,
    date: '2025-04-01',
    comment: 'Test comment'
  };

  beforeEach(() => {
    dateCommentStorage = new DateCommentStorage();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getDateComments', () => {
    it('should return date comments for specified group and month', async () => {
      // Подготовка
      const mockResult = [mockDateComment];
      (db.select().from().where as jest.Mock).mockImplementation(() => ({
        then: (callback: Function) => Promise.resolve(callback(mockResult))
      }));

      // Вызов
      const result = await dateCommentStorage.getDateComments(123, 4, 2025);

      // Проверка
      expect(result).toEqual(mockResult);
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('createDateComment', () => {
    it('should update existing comment if it exists', async () => {
      // Подготовка
      (db.select().from().where as jest.Mock).mockReturnValueOnce([mockDateComment]);
      (db.update().set().where().returning as jest.Mock).mockResolvedValueOnce([mockDateComment]);

      // Вызов
      const result = await dateCommentStorage.createDateComment({
        groupId: 123,
        date: '2025-04-01',
        comment: 'Updated comment'
      });

      // Проверка
      expect(result).toEqual(mockDateComment);
      expect(db.update).toHaveBeenCalled();
    });

    it('should create new comment if it does not exist', async () => {
      // Подготовка
      (db.select().from().where as jest.Mock).mockReturnValueOnce([]);
      (db.insert().values().returning as jest.Mock).mockResolvedValueOnce([mockDateComment]);

      // Вызов
      const result = await dateCommentStorage.createDateComment({
        groupId: 123,
        date: '2025-04-01',
        comment: 'New comment'
      });

      // Проверка
      expect(result).toEqual(mockDateComment);
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('getDateCommentById', () => {
    it('should return comment by ID', async () => {
      // Подготовка
      (db.select().from().where as jest.Mock).mockResolvedValueOnce([mockDateComment]);

      // Вызов
      const result = await dateCommentStorage.getDateCommentById(1);

      // Проверка
      expect(result).toEqual(mockDateComment);
    });

    it('should return undefined if comment not found', async () => {
      // Подготовка
      (db.select().from().where as jest.Mock).mockResolvedValueOnce([]);

      // Вызов
      const result = await dateCommentStorage.getDateCommentById(999);

      // Проверка
      expect(result).toBeUndefined();
    });
  });

  describe('getDateComment', () => {
    it('should return comment by group ID and date', async () => {
      // Подготовка
      (db.select().from().where as jest.Mock).mockResolvedValueOnce([mockDateComment]);

      // Вызов
      const result = await dateCommentStorage.getDateComment(123, new Date('2025-04-01'));

      // Проверка
      expect(result).toEqual(mockDateComment);
    });
  });

  describe('updateDateComment', () => {
    it('should update comment and return updated record', async () => {
      // Подготовка
      const updatedComment = { ...mockDateComment, comment: 'Updated comment' };
      (db.update().set().where().returning as jest.Mock).mockResolvedValueOnce([updatedComment]);

      // Вызов
      const result = await dateCommentStorage.updateDateComment(1, 'Updated comment');

      // Проверка
      expect(result).toEqual(updatedComment);
    });

    it('should throw error if comment not found', async () => {
      // Подготовка
      (db.update().set().where().returning as jest.Mock).mockResolvedValueOnce([]);

      // Вызов и проверка
      await expect(dateCommentStorage.updateDateComment(999, 'Test')).rejects.toThrow();
    });
  });

  describe('deleteDateComment', () => {
    it('should delete comment and return true', async () => {
      // Подготовка
      (db.delete().where().returning as jest.Mock).mockResolvedValueOnce([mockDateComment]);

      // Вызов
      const result = await dateCommentStorage.deleteDateComment(1);

      // Проверка
      expect(result).toBe(true);
    });

    it('should return false if comment not found', async () => {
      // Подготовка
      (db.delete().where().returning as jest.Mock).mockResolvedValueOnce([]);

      // Вызов
      const result = await dateCommentStorage.deleteDateComment(999);

      // Проверка
      expect(result).toBe(false);
    });
  });
});