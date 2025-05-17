import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExtendedTrialRequest } from "@shared/schema";
import { TrialRequestService } from "../services/TrialRequestService";
import { apiRequest } from "@/lib/api";

/**
 * Хук для работы с заявками на пробные занятия
 * Следует принципу единственной ответственности (SRP) из SOLID
 */
export function useTrialRequests() {
  const queryClient = useQueryClient();

  // Получение всех заявок
  const { data: requests, isLoading } = useQuery<ExtendedTrialRequest[]>({
    queryKey: ["/api/trial-requests"],
    queryFn: async () => {
      return await TrialRequestService.getAllTrialRequests();
    },
  });

  // Мутация для обновления статуса заявки
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, scheduledDate, notes }: { 
      id: number; 
      status: string;
      scheduledDate?: Date;
      notes?: string;
    }) => {
      // Проверка данных
      const normalizedStatus = status.toUpperCase();
      
      // Если статус "TRIAL_ASSIGNED", но дата не указана, выдаем ошибку
      if (normalizedStatus === "TRIAL_ASSIGNED" && !scheduledDate) {
        throw new Error('Для пробного занятия необходимо указать дату');
      }
      
      console.log(`Обновление статуса заявки #${id} на ${normalizedStatus}`, { notes });
      
      // Подготавливаем данные для запроса
      const payload: any = {
        status: normalizedStatus
      };
      
      // Добавляем дату, если она указана
      if (scheduledDate) {
        payload.scheduledDate = scheduledDate.toISOString();
      }
      
      // Добавляем примечания, если они указаны
      if (notes) {
        payload.notes = notes;
      }
      
      // Делаем PATCH запрос для обновления статуса
      const res = await apiRequest("PATCH", `/api/trial-requests/${id}/status`, payload);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Ошибка при обновлении статуса', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Ошибка при обновлении статуса');
        } catch (e) {
          throw new Error('Ошибка при обновлении статуса');
        }
      }
      
      const updatedRequest = await res.json();
      return updatedRequest;
    },
    
    // Оптимистичное обновление данных - мгновенное обновление UI
    onMutate: async (variables) => {
      console.log('Оптимистичное обновление для заявки:', variables);
      
      // Немедленно отменяем текущие запросы, чтобы не перезаписать оптимистичное обновление
      await queryClient.cancelQueries({ queryKey: ["/api/trial-requests"] });

      // Сохраняем предыдущее состояние для отката в случае ошибки
      const previousRequests = queryClient.getQueryData<ExtendedTrialRequest[]>(["/api/trial-requests"]);

      // Обновляем кэш оптимистично и мгновенно
      queryClient.setQueryData<ExtendedTrialRequest[]>(["/api/trial-requests"], (old = []) => {
        if (!old || !Array.isArray(old)) return old;
        
        return old.map(request => {
          if (request.id === variables.id) {
            // Создаем обновленную копию запроса со всеми необходимыми полями
            const updatedRequest: ExtendedTrialRequest = {
              ...request,
              status: variables.status as string,
              scheduledDate: variables.scheduledDate || null,
              notes: variables.notes || request.notes
            };
            console.log('Оптимистично обновленная заявка:', updatedRequest);
            return updatedRequest;
          }
          return request;
        });
      });

      return { previousRequests };
    },
    
    // Обработка ошибок с восстановлением предыдущего состояния
    onError: (error, variables, context) => {
      console.error('Ошибка при обновлении статуса заявки:', error);
      
      // Восстанавливаем предыдущее состояние
      if (context?.previousRequests) {
        queryClient.setQueryData(["/api/trial-requests"], context.previousRequests);
      }
      
      // Показываем ошибку в консоли для отладки
      console.error(`Не удалось обновить заявку #${variables.id} на статус ${variables.status}`);
    },
    
    // По успешному выполнению обновляем кэш без полной перезагрузки данных
    onSuccess: (data) => {
      console.log('Мутация успешно выполнена с данными:', data);
      
      // Принудительно обновляем данные с сервера
      queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
      
      // Мгновенно обновляем кэш с новыми данными, сохраняя связанные объекты
      queryClient.setQueryData<ExtendedTrialRequest[]>(["/api/trial-requests"], (old = []) => {
        if (!old || !Array.isArray(old)) return old;
        
        return old.map(request => {
          if (request.id === data.id) {
            console.log(`Обновляем заявку ${request.id} с новым статусом ${data.status}`);
            // Сохраняем важные связанные объекты, которые могут отсутствовать в ответе API
            return { 
              ...data,
              section: request.section || data.section,
              branch: request.branch || data.branch
            };
          }
          return request;
        });
      });
      
      // Через короткое время обновляем данные из базы
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
      }, 300); // Быстрая задержка для обновления
    }
  });

  return {
    requests,
    isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
}