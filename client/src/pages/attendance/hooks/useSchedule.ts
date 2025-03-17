import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const useSchedule = (groupId?: number, month?: number, year?: number) => {
  const { data: scheduleDates = [], isLoading } = useQuery<Date[]>({
    queryKey: ["/api/groups", groupId, "schedule-dates", month, year],
    queryFn: async () => {
      if (!groupId) return [];
      console.log('Fetching schedule dates:', { groupId, month, year });

      const res = await apiRequest(
        "GET",
        `/api/groups/${groupId}/schedule-dates?month=${month}&year=${year}`
      );

      if (!res.ok) {
        const error = await res.text();
        console.error('Failed to fetch schedule dates:', error);
        throw new Error('Failed to fetch schedule dates');
      }

      const dates = await res.json();
      console.log('Received schedule dates:', dates);
      return dates.map((d: string) => new Date(d));
    },
    enabled: !!groupId,
  });

  return { 
    scheduleDates: scheduleDates || [], 
    isLoading 
  };
};