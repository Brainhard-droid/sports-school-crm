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
      
      console.log(`Обновление статуса заявки #${id} на ${normalizedStatus}`);
      
      // Создаем объект с параметрами для вызова сервиса
      const params: any = {
        id,
        status: normalizedStatus,
      };
      
      // Добавляем необязательные параметры, если они указаны
      if (scheduledDate) params.scheduledDate = scheduledDate;
      if (notes) params.notes = notes;
      
      // Используем готовый сервис для обновления статуса
      return await TrialRequestService.updateRequestStatus(
        params.id, 
        params.status,
        params.scheduledDate,
        params.notes
      );
    },
    
    // Оптимистичное обновление данных
    onMutate: async (variables) => {
      console.log('Оптимистичное обновление для заявки:', variables);
      
      // Отменяем текущие запросы, чтобы не перезаписать оптимистичное обновление
      await queryClient.cancelQueries({ queryKey: ["/api/trial-requests"] });

      // Сохраняем предыдущее состояние для отката в случае ошибки
      const previousRequests = queryClient.getQueryData<ExtendedTrialRequest[]>(["/api/trial-requests"]);

      // Обновляем кэш оптимистично
      queryClient.setQueryData<ExtendedTrialRequest[]>(["/api/trial-requests"], (old = []) => {
        return old.map(request => {
          if (request.id === variables.id) {
            // Создаем обновленную копию запроса
            const updatedRequest: ExtendedTrialRequest = {
              ...request,
              status: variables.status as string,
              scheduledDate: variables.scheduledDate || null
            };
            console.log('Оптимистично обновленная заявка:', updatedRequest);
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
    
    // По успешному выполнению обновляем кэш без полной перезагрузки данных
    onSuccess: (data) => {
      console.log('Мутация успешно выполнена с данными:', data);
      
      // Обновляем кэш с новыми данными, чтобы избежать перемещения карточек
      queryClient.setQueryData<ExtendedTrialRequest[]>(["/api/trial-requests"], (old = []) => {
        if (!old || !Array.isArray(old)) return old;
        
        return old.map(request => {
          if (request.id === data.id) {
            console.log(`Обновляем заявку ${request.id} с новым статусом ${data.status}`);
            return data;
          }
          return request;
        });
      });
    },
    
    // В любом случае после завершения запрашиваем свежие данные с задержкой
    onSettled: () => {
      // Добавляем задержку перед запросом свежих данных,
      // чтобы пользователь успел увидеть результат своего действия
      setTimeout(() => {
        console.log('Обновляем данные запросов после мутации');
        queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
      }, 2000); // Задержка 2 секунды
    },
  });

  return {
    requests,
    isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
}