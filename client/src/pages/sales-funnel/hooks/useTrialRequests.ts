import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";

export function useTrialRequests() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery<ExtendedTrialRequest[]>({
    queryKey: ["/api/trial-requests"],
    queryFn: async () => {
      console.log('Fetching trial requests...');
      const res = await apiRequest("GET", "/api/trial-requests");
      const data = await res.json();
      console.log('Received trial requests:', data);
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, scheduledDate }: { 
      id: number; 
      status: keyof typeof TrialRequestStatus;
      scheduledDate?: Date;
    }) => {
      console.log('Updating trial request status:', { id, status, scheduledDate });
      const res = await apiRequest("PUT", `/api/trial-requests/${id}`, { 
        status,
        scheduledDate: scheduledDate?.toISOString()
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Ошибка при обновлении статуса');
      }
      return res.json();
    },
    onMutate: async (variables) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries({ queryKey: ["/api/trial-requests"] });

      // Сохраняем предыдущее состояние
      const previousRequests = queryClient.getQueryData<ExtendedTrialRequest[]>(["/api/trial-requests"]);

      // Оптимистично обновляем UI
      queryClient.setQueryData<ExtendedTrialRequest[]>(["/api/trial-requests"], (old = []) => {
        return old.map(request =>
          request.id === variables.id
            ? { ...request, status: variables.status, scheduledDate: variables.scheduledDate }
            : request
        );
      });

      return { previousRequests };
    },
    onError: (_, __, context) => {
      // При ошибке возвращаем предыдущее состояние
      queryClient.setQueryData(["/api/trial-requests"], context?.previousRequests);
    },
    onSettled: () => {
      // В любом случае инвалидируем кеш
      queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ExtendedTrialRequest> }) => {
      console.log('Updating trial request:', { id, data });
      const res = await apiRequest("PUT", `/api/trial-requests/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Ошибка при обновлении заявки');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
    },
  });

  return {
    requests,
    isLoading,
    updateStatus: updateStatusMutation.mutate,
    updateRequest: updateRequestMutation.mutate,
  };
}