import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from 'express';
import { getDateComments, createDateComment, updateDateComment, deleteDateComment } from '../controllers/dateCommentController';
import { storage } from '../storage';

// Мокаем хранилище
jest.mock('../storage', () => ({
  storage: {
    getDateComments: jest.fn(),
    createDateComment: jest.fn(),
    getDateCommentById: jest.fn(),
    updateDateComment: jest.fn(),
    deleteDateComment: jest.fn()
  }
}));

describe('DateCommentController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockDateComment = {
    id: 1,
    groupId: 123,
    date: '2025-04-01',
    comment: 'Test comment'
  };

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn()
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getDateComments', () => {
    it('should return date comments for specified group and month', async () => {
      // Подготовка
      mockRequest.query = { groupId: '123', month: '4', year: '2025' };
      (storage.getDateComments as jest.Mock).mockResolvedValue([mockDateComment]);

      // Вызов
      await getDateComments(mockRequest as Request, mockResponse as Response);

      // Проверка
      expect(storage.getDateComments).toHaveBeenCalledWith(123, 4, 2025);
      expect(mockResponse.json).toHaveBeenCalledWith([mockDateComment]);
    });

    it('should return 400 on invalid query parameters', async () => {
      // Подготовка
      mockRequest.query = { groupId: 'invalid', month: '13', year: '2025' };

      // Вызов
      await getDateComments(mockRequest as Request, mockResponse as Response);

      // Проверка
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('createDateComment', () => {
    it('should create comment and return it', async () => {
      // Подготовка
      mockRequest.body = { 
        groupId: 123, 
        date: '2025-04-01', 
        comment: 'New comment' 
      };
      (storage.createDateComment as jest.Mock).mockResolvedValue(mockDateComment);

      // Вызов
      await createDateComment(mockRequest as Request, mockResponse as Response);

      // Проверка
      expect(storage.createDateComment).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockDateComment);
    });

    it('should return 400 on invalid body', async () => {
      // Подготовка
      mockRequest.body = { 
        // Отсутствует groupId
        date: '2025-04-01', 
        comment: 'New comment' 
      };

      // Вызов
      await createDateComment(mockRequest as Request, mockResponse as Response);

      // Проверка
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('updateDateComment', () => {
    it('should update comment and return it', async () => {
      // Подготовка
      mockRequest.params = { id: '1' };
      mockRequest.body = { comment: 'Updated comment' };
      (storage.getDateCommentById as jest.Mock).mockResolvedValue(mockDateComment);
      (storage.updateDateComment as jest.Mock).mockResolvedValue({
        ...mockDateComment,
        comment: 'Updated comment'
      });

      // Вызов
      await updateDateComment(mockRequest as Request, mockResponse as Response);

      // Проверка
      expect(storage.updateDateComment).toHaveBeenCalledWith(1, 'Updated comment');
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 404 if comment not found', async () => {
      // Подготовка
      mockRequest.params = { id: '999' };
      mockRequest.body = { comment: 'Updated comment' };
      (storage.getDateCommentById as jest.Mock).mockResolvedValue(undefined);

      // Вызов
      await updateDateComment(mockRequest as Request, mockResponse as Response);

      // Проверка
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('deleteDateComment', () => {
    it('should delete comment and return 204', async () => {
      // Подготовка
      mockRequest.params = { id: '1' };
      (storage.getDateCommentById as jest.Mock).mockResolvedValue(mockDateComment);
      (storage.deleteDateComment as jest.Mock).mockResolvedValue(true);

      // Вызов
      await deleteDateComment(mockRequest as Request, mockResponse as Response);

      // Проверка
      expect(storage.deleteDateComment).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should return 404 if comment not found', async () => {
      // Подготовка
      mockRequest.params = { id: '999' };
      (storage.getDateCommentById as jest.Mock).mockResolvedValue(undefined);

      // Вызов
      await deleteDateComment(mockRequest as Request, mockResponse as Response);

      // Проверка
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
});