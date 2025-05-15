import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExtendedTrialRequest } from "@shared/schema";
import { TrialRequestService } from "../services/TrialRequestService";

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
    mutationFn: async ({ id, status, scheduledDate }: { 
      id: number; 
      status: string;
      scheduledDate?: Date;
    }) => {
      // Проверка данных
      const normalizedStatus = status.toUpperCase();
      
      // Если статус "TRIAL_ASSIGNED", но дата не указана, выдаем ошибку
      if (normalizedStatus === "TRIAL_ASSIGNED" && !scheduledDate) {
        throw new Error('Для пробного занятия необходимо указать дату');
      }
      
      // Делегируем логику обновления сервису
      return await TrialRequestService.updateRequestStatus(id, normalizedStatus, scheduledDate);
    },
    
    // Оптимистичное обновление данных
    onMutate: async (variables) => {
      // Отменяем текущие запросы, чтобы не перезаписать оптимистичное обновление
      await queryClient.cancelQueries({ queryKey: ["/api/trial-requests"] });

      // Сохраняем предыдущее состояние для отката в случае ошибки
      const previousRequests = queryClient.getQueryData<ExtendedTrialRequest[]>(["/api/trial-requests"]);

      // Обновляем кэш оптимистично
      queryClient.setQueryData<ExtendedTrialRequest[]>(["/api/trial-requests"], (old = []) => {
        return old.map(request => {
          if (request.id === variables.id) {
            const updatedRequest: ExtendedTrialRequest = {
              ...request,
              status: variables.status as string,
              scheduledDate: variables.scheduledDate || null
            };
            return updatedRequest;
          }
          return request;
        });
      });

      return { previousRequests };
    },
    
    // Если произошла ошибка, восстанавливаем предыдущее состояние
    onError: (_, __, context) => {
      console.error('Error updating trial request status, restoring previous state');
      queryClient.setQueryData(["/api/trial-requests"], context?.previousRequests);
    },
    
    // В любом случае после завершения запрашиваем свежие данные
    onSettled: () => {
      console.log('Refreshing trial requests data after mutation');
      queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
    },
  });

  return {
    requests,
    isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
}