import request from 'supertest';
import express from 'express';
import { expect, jest, test, describe, beforeAll, afterAll } from '@jest/globals';
import { storage } from '../../storage';
import { TrialRequestController } from '../../controllers/trialRequestController';
import { TrialRequestStatus } from '@shared/schema';
import { validateBody } from '../../middleware/validation';
import { ApiErrorClass } from '../../middleware/error';

// Мок для TrialRequestStorage
jest.mock('../../storage', () => ({
  storage: {
    createTrialRequest: jest.fn(),
    getSectionById: jest.fn(),
    getBranchById: jest.fn(),
    getTrialRequestById: jest.fn(),
    updateTrialRequest: jest.fn(),
    updateTrialRequestStatus: jest.fn(),
    getAllTrialRequests: jest.fn(),
  }
}));

// Мок для сервиса отправки уведомлений
jest.mock('../../services/email', () => ({
  sendTrialAssignmentNotification: jest.fn().mockResolvedValue(true),
}));

describe('TrialRequest Integration Tests', () => {
  let app: express.Application;
  
  beforeAll(() => {
    // Создаем тестовое приложение Express
    app = express();
    app.use(express.json());
    
    // Настраиваем маршруты
    const router = express.Router();
    router.post('/trial-requests', 
      validateBody(TrialRequestController.validationSchemas.create),
      TrialRequestController.createTrialRequest
    );
    router.get('/trial-requests', TrialRequestController.getAllTrialRequests);
    router.get('/trial-requests/:id', TrialRequestController.getTrialRequestById);
    router.patch('/trial-requests/:id/status', TrialRequestController.updateTrialRequestStatus);
    
    // Обработчик ошибок
    app.use('/api', router);
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (err instanceof ApiErrorClass) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      res.status(500).json({ message: 'Internal Server Error' });
    });
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/trial-requests', () => {
    it('должен создавать новую заявку на пробное занятие', async () => {
      // Arrange
      const mockSection = { id: 1, name: 'Section 1' };
      const mockBranch = { id: 2, name: 'Branch 2' };
      const mockCreatedRequest = {
        id: 1,
        childName: 'Иван',
        childAge: 7,
        parentName: 'Анна',
        parentPhone: '+79991234567',
        sectionId: 1,
        branchId: 2,
        desiredDate: new Date().toISOString(),
        status: TrialRequestStatus.NEW,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (storage.getSectionById as jest.Mock).mockResolvedValue(mockSection);
      (storage.getBranchById as jest.Mock).mockResolvedValue(mockBranch);
      (storage.createTrialRequest as jest.Mock).mockResolvedValue(mockCreatedRequest);

      // Act
      const response = await request(app)
        .post('/api/trial-requests')
        .send({
          childName: 'Иван',
          childAge: 7,
          parentName: 'Анна',
          parentPhone: '+79991234567',
          sectionId: 1,
          branchId: 2,
          desiredDate: new Date().toISOString(),
          consentToDataProcessing: true
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedRequest);
      expect(storage.getSectionById).toHaveBeenCalledWith(1);
      expect(storage.getBranchById).toHaveBeenCalledWith(2);
      expect(storage.createTrialRequest).toHaveBeenCalled();
    });

    it('должен возвращать ошибку 400, если нет согласия на обработку данных', async () => {
      // Act
      const response = await request(app)
        .post('/api/trial-requests')
        .send({
          childName: 'Иван',
          childAge: 7,
          parentName: 'Анна',
          parentPhone: '+79991234567',
          sectionId: 1,
          branchId: 2,
          desiredDate: new Date().toISOString(),
          consentToDataProcessing: false
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Необходимо согласие на обработку персональных данных');
    });

    it('должен возвращать ошибку 404, если секция не найдена', async () => {
      // Arrange
      (storage.getSectionById as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post('/api/trial-requests')
        .send({
          childName: 'Иван',
          childAge: 7,
          parentName: 'Анна',
          parentPhone: '+79991234567',
          sectionId: 999,
          branchId: 2,
          desiredDate: new Date().toISOString(),
          consentToDataProcessing: true
        });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('секция не найдена');
    });
  });

  describe('PATCH /api/trial-requests/:id/status', () => {
    it('должен обновлять статус заявки', async () => {
      // Arrange
      const mockExistingRequest = {
        id: 1,
        childName: 'Иван',
        childAge: 7,
        parentName: 'Анна',
        parentPhone: '+79991234567',
        sectionId: 1,
        branchId: 2,
        desiredDate: new Date().toISOString(),
        status: TrialRequestStatus.NEW,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockUpdatedRequest = {
        ...mockExistingRequest,
        status: TrialRequestStatus.TRIAL_ASSIGNED,
        scheduledDate: new Date().toISOString()
      };

      (storage.getTrialRequestById as jest.Mock).mockResolvedValue(mockExistingRequest);
      (storage.updateTrialRequest as jest.Mock).mockResolvedValue(mockUpdatedRequest);

      // Act
      const response = await request(app)
        .patch('/api/trial-requests/1/status')
        .send({
          status: TrialRequestStatus.TRIAL_ASSIGNED,
          scheduledDate: new Date().toISOString()
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedRequest);
    });

    it('должен возвращать ошибку 404, если заявка не найдена', async () => {
      // Arrange
      (storage.getTrialRequestById as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await request(app)
        .patch('/api/trial-requests/999/status')
        .send({
          status: TrialRequestStatus.TRIAL_ASSIGNED,
          scheduledDate: new Date().toISOString()
        });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Заявка не найдена');
    });
  });

  describe('GET /api/trial-requests', () => {
    it('должен возвращать список всех заявок', async () => {
      // Arrange
      const mockRequests = [
        {
          id: 1,
          childName: 'Иван',
          childAge: 7,
          parentName: 'Анна',
          parentPhone: '+79991234567',
          sectionId: 1,
          branchId: 2,
          desiredDate: new Date().toISOString(),
          status: TrialRequestStatus.NEW,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          childName: 'Мария',
          childAge: 9,
          parentName: 'Ольга',
          parentPhone: '+79997654321',
          sectionId: 2,
          branchId: 1,
          desiredDate: new Date().toISOString(),
          status: TrialRequestStatus.TRIAL_ASSIGNED,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (storage.getAllTrialRequests as jest.Mock).mockResolvedValue(mockRequests);

      // Act
      const response = await request(app)
        .get('/api/trial-requests');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequests);
    });
  });

  describe('GET /api/trial-requests/:id', () => {
    it('должен возвращать заявку по ID', async () => {
      // Arrange
      const mockRequest = {
        id: 1,
        childName: 'Иван',
        childAge: 7,
        parentName: 'Анна',
        parentPhone: '+79991234567',
        sectionId: 1,
        branchId: 2,
        desiredDate: new Date().toISOString(),
        status: TrialRequestStatus.NEW,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (storage.getTrialRequestById as jest.Mock).mockResolvedValue(mockRequest);

      // Act
      const response = await request(app)
        .get('/api/trial-requests/1');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRequest);
    });

    it('должен возвращать ошибку 404, если заявка не найдена', async () => {
      // Arrange
      (storage.getTrialRequestById as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await request(app)
        .get('/api/trial-requests/999');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Заявка не найдена');
    });
  });
});