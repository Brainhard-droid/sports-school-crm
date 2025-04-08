import { useQuery } from "@tanstack/react-query";

/**
 * Хук для получения дат расписания группы за указанный месяц и год
 */
export function useGroupScheduleDates(groupId: number, month: number, year: number) {
  return useQuery<string[]>({
    queryKey: [`/api/groups/${groupId}/schedule-dates`, month, year],
    enabled: !!groupId && !isNaN(month) && !isNaN(year),
    queryFn: async ({ queryKey }) => {
      const [endpoint, month, year] = queryKey;
      const url = `${endpoint}?month=${month}&year=${year}`;
      const response = await fetch(url, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Не удалось получить даты расписания");
      }
      
      return response.json();
    }
  });
}