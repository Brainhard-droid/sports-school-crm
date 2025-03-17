import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const useSchedule = (groupId?: number, month?: number, year?: number) => {
  const { data: scheduleDates } = useQuery<Date[]>({
    queryKey: ["/api/groups", groupId, "schedule-dates", month, year],
    queryFn: async () => {
      if (!groupId) return [];
      const res = await apiRequest(
        "GET",
        `/api/groups/${groupId}/schedule-dates?month=${month}&year=${year}`
      );
      const dates = await res.json();
      return dates.map((d: string) => new Date(d));
    },
    enabled: !!groupId,
  });

  return { scheduleDates };
};
