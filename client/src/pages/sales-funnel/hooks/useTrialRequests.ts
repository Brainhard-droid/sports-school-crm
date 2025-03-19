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
    mutationFn: async ({ id, status }: { id: number; status: keyof typeof TrialRequestStatus }) => {
      console.log('Updating trial request status:', { id, status });
      const res = await apiRequest("PUT", `/api/trial-requests/${id}`, { status });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Ошибка при обновлении статуса');
      }
      return res.json();
    },
    onSuccess: () => {
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