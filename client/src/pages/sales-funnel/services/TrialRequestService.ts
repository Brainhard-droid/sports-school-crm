import { apiRequest } from "@/lib/api";
import { ExtendedTrialRequest, Branch, SportsSection } from "@shared/schema";

/**
 * Сервис для работы с заявками на пробные занятия
 * Класс отвечает за взаимодействие с API и обогащение данных
 */
export class TrialRequestService {
  /**
   * Получает все заявки на пробные занятия с данными о филиалах и секциях
   */
  static async getAllTrialRequests(): Promise<ExtendedTrialRequest[]> {
    console.log('Fetching trial requests...');
    
    // Получаем заявки
    const res = await apiRequest("GET", "/api/trial-requests");
    const requests: ExtendedTrialRequest[] = await res.json();
    
    if (!requests || !Array.isArray(requests)) {
      console.error('Invalid response format for trial requests:', requests);
      return [];
    }
    
    console.log('Received trial requests:', requests);
    
    // Получаем все секции и филиалы для обогащения данных
    const enrichedRequests = await this.enrichRequestsWithBranchAndSectionData(requests);
    console.log('Enriched requests with branch and section data:', enrichedRequests);
    
    return enrichedRequests;
  }
  
  /**
   * Обновляет статус заявки
   */
  static async updateRequestStatus(
    id: number, 
    status: string, 
    scheduledDate?: Date
  ): Promise<ExtendedTrialRequest> {
    console.log('Updating trial request status:', { id, status, scheduledDate });
    
    const res = await apiRequest("PATCH", `/api/trial-requests/${id}`, { 
      status: status.toUpperCase(),
      scheduledDate: scheduledDate?.toISOString()
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Ошибка при обновлении статуса');
    }
    
    const updatedRequest = await res.json();
    console.log('Status updated successfully:', updatedRequest);
    
    // Обогащаем данные о филиале и секции
    const enrichedRequest = await this.enrichRequestWithBranchAndSectionData(updatedRequest);
    return enrichedRequest;
  }
  
  /**
   * Обогащает заявку данными о филиале и секции
   */
  private static async enrichRequestWithBranchAndSectionData(
    request: ExtendedTrialRequest
  ): Promise<ExtendedTrialRequest> {
    // Если у заявки уже есть данные о филиале и секции, возвращаем как есть
    if (request.branch && request.section) {
      return request;
    }
    
    try {
      // Получаем данные о филиале
      if (request.branchId && !request.branch) {
        const branchRes = await apiRequest("GET", `/api/branches/${request.branchId}`);
        if (branchRes.ok) {
          const branch: Branch = await branchRes.json();
          request.branch = branch;
        }
      }
      
      // Получаем данные о секции
      if (request.sectionId && !request.section) {
        const sectionRes = await apiRequest("GET", `/api/sports-sections/${request.sectionId}`);
        if (sectionRes.ok) {
          const section: SportsSection = await sectionRes.json();
          request.section = section;
        }
      }
    } catch (error) {
      console.error('Error enriching request data:', error);
    }
    
    return request;
  }
  
  /**
   * Обогащает массив заявок данными о филиалах и секциях
   */
  private static async enrichRequestsWithBranchAndSectionData(
    requests: ExtendedTrialRequest[]
  ): Promise<ExtendedTrialRequest[]> {
    // Получаем все филиалы и секции в одном запросе
    try {
      const [branchesRes, sectionsRes] = await Promise.all([
        apiRequest("GET", "/api/branches"),
        apiRequest("GET", "/api/sports-sections")
      ]);
      
      const branches: Branch[] = branchesRes.ok ? await branchesRes.json() : [];
      const sections: SportsSection[] = sectionsRes.ok ? await sectionsRes.json() : [];
      
      // Создаем карты для быстрого поиска
      const branchMap = new Map<number, Branch>();
      const sectionMap = new Map<number, SportsSection>();
      
      branches.forEach(branch => branchMap.set(branch.id, branch));
      sections.forEach(section => sectionMap.set(section.id, section));
      
      // Обогащаем каждую заявку
      return requests.map(request => {
        const enrichedRequest = { ...request };
        
        if (request.branchId && !request.branch) {
          enrichedRequest.branch = branchMap.get(request.branchId);
        }
        
        if (request.sectionId && !request.section) {
          enrichedRequest.section = sectionMap.get(request.sectionId);
        }
        
        return enrichedRequest;
      });
    } catch (error) {
      console.error('Error enriching requests with branch and section data:', error);
      return requests;
    }
  }
}