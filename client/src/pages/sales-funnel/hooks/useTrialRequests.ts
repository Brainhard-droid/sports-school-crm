import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";

export function useTrialRequests() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery<ExtendedTrialRequest[]>({
    queryKey: ["/api/trial-requests"],
    refetchInterval: 5000, // Refetch every 5 seconds
    credentials: 'include'
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