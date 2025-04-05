import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api";
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
      const res = await apiRequest("PATCH", `/api/trial-requests/${id}`, { 
        status: status.toUpperCase(),
        scheduledDate: scheduledDate?.toISOString()
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Ошибка при обновлении статуса');
      }
      return res.json();
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["/api/trial-requests"] });

      const previousRequests = queryClient.getQueryData<ExtendedTrialRequest[]>(["/api/trial-requests"]);

      queryClient.setQueryData<ExtendedTrialRequest[]>(["/api/trial-requests"], (old = []) => {
        return old.map(request =>
          request.id === variables.id
            ? { 
                ...request, 
                status: variables.status, 
                scheduledDate: variables.scheduledDate?.toISOString() || null
              }
            : request
        );
      });

      return { previousRequests };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["/api/trial-requests"], context?.previousRequests);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
    },
  });

  return {
    requests,
    isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
}