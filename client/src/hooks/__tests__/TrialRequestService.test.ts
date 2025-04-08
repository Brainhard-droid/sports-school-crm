import { TrialRequestService, ExtendedTrialRequestForm } from '../use-trial-request';
import * as api from '@/lib/api';

// Мокируем модуль api
jest.mock('@/lib/api', () => ({
  apiRequest: jest.fn(),
  getResponseData: jest.fn()
}));

describe('TrialRequestService', () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    jest.clearAllMocks();
  });

  describe('createTrialRequest', () => {
    const mockData: ExtendedTrialRequestForm = {
      childName: 'Test Child',
      childAge: 7,
      parentName: 'Test Parent',
      parentPhone: '+79991234567',
      sectionId: 1,
      branchId: 2,
      desiredDate: new Date().toISOString(),
      consentToDataProcessing: true
    };

    const mockResponse = {
      id: 1,
      ...mockData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('должен правильно отправлять запрос на создание с правильными данными', async () => {
      // Arrange
      const mockApiResponse = { ok: true, status: 201 };
      (api.apiRequest as jest.Mock).mockResolvedValue(mockApiResponse);
      (api.getResponseData as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await TrialRequestService.createTrialRequest(mockData);

      // Assert
      expect(api.apiRequest).toHaveBeenCalledWith('POST', '/api/trial-requests', {
        ...mockData,
        childAge: Number(mockData.childAge),
        sectionId: Number(mockData.sectionId),
        branchId: Number(mockData.branchId),
      });
      expect(api.getResponseData).toHaveBeenCalledWith(mockApiResponse);
      expect(result).toEqual(mockResponse);
    });

    it('должен обрабатывать ошибки и повторно вызывать исключение', async () => {
      // Arrange
      const mockError = new Error('API Error');
      (api.apiRequest as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      await expect(TrialRequestService.createTrialRequest(mockData))
        .rejects
        .toThrow('API Error');
      
      expect(api.apiRequest).toHaveBeenCalledWith('POST', '/api/trial-requests', expect.any(Object));
      expect(api.getResponseData).not.toHaveBeenCalled();
    });
  });

  describe('getSections', () => {
    const mockSections = [
      { id: 1, name: 'Section 1' },
      { id: 2, name: 'Section 2' }
    ];

    it('должен правильно получать секции', async () => {
      // Arrange
      const mockApiResponse = { ok: true };
      (api.apiRequest as jest.Mock).mockResolvedValue(mockApiResponse);
      (api.getResponseData as jest.Mock).mockResolvedValue(mockSections);

      // Act
      const result = await TrialRequestService.getSections();

      // Assert
      expect(api.apiRequest).toHaveBeenCalledWith('GET', '/api/sections');
      expect(api.getResponseData).toHaveBeenCalledWith(mockApiResponse);
      expect(result).toEqual(mockSections);
    });

    it('должен возвращать пустой массив при ошибке', async () => {
      // Arrange
      const mockError = new Error('API Error');
      (api.apiRequest as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await TrialRequestService.getSections();

      // Assert
      expect(api.apiRequest).toHaveBeenCalledWith('GET', '/api/sections');
      expect(result).toEqual([]);
    });
  });

  describe('getBranchesBySection', () => {
    const mockBranches = [
      { id: 1, name: 'Branch 1', sectionId: 1 },
      { id: 2, name: 'Branch 2', sectionId: 1 }
    ];

    it('должен правильно получать филиалы для секции', async () => {
      // Arrange
      const mockApiResponse = { ok: true };
      (api.apiRequest as jest.Mock).mockResolvedValue(mockApiResponse);
      (api.getResponseData as jest.Mock).mockResolvedValue(mockBranches);

      // Act
      const result = await TrialRequestService.getBranchesBySection(1);

      // Assert
      expect(api.apiRequest).toHaveBeenCalledWith('GET', '/api/branches-by-section?sectionId=1');
      expect(api.getResponseData).toHaveBeenCalledWith(mockApiResponse);
      expect(result).toEqual(mockBranches);
    });

    it('должен возвращать пустой массив при ошибке', async () => {
      // Arrange
      const mockError = new Error('API Error');
      (api.apiRequest as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await TrialRequestService.getBranchesBySection(1);

      // Assert
      expect(api.apiRequest).toHaveBeenCalledWith('GET', '/api/branches-by-section?sectionId=1');
      expect(result).toEqual([]);
    });

    it('должен возвращать пустой массив, если sectionId не передан', async () => {
      // Act
      const result = await TrialRequestService.getBranchesBySection(0);

      // Assert
      expect(api.apiRequest).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});