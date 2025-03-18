
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";

export function useTrialRequests() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading, error } = useQuery<ExtendedTrialRequest[]>({
    queryKey: ["/api/trial-requests"],
    queryFn: async () => {
      console.log('Fetching trial requests...');
      try {
        const res = await apiRequest("GET", "/api/trial-requests");
        const data = await res.json();
        console.log('Received trial requests:', data);
        return data;
      } catch (err) {
        console.error('Error fetching trial requests:', err);
        throw err;
      }
    },
    suspense: false,
    retry: false,
    staleTime: 0,
    cacheTime: 0
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: keyof typeof TrialRequestStatus }) => {
      const res = await apiRequest("PUT", `/api/trial-requests/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ExtendedTrialRequest> }) => {
      const res = await apiRequest("PUT", `/api/trial-requests/${id}`, data);
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
