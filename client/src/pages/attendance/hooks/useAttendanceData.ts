// useAttendanceData.ts
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Group, Student, Attendance, DateComment } from "@shared/schema";

export function useAttendanceData(selectedGroup: Group | null, selectedMonth: Date) {
  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/group-students", selectedGroup?.id],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const res = await apiRequest("GET", `/api/group-students/${selectedGroup.id}`);
      return res.json();
    },
    enabled: !!selectedGroup,
  });

  const { data: scheduleDates } = useQuery<Date[]>({
    queryKey: [
      "/api/groups",
      selectedGroup?.id,
      "schedule-dates",
      selectedMonth.getMonth() + 1,
      selectedMonth.getFullYear(),
    ],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const res = await apiRequest(
        "GET",
        `/api/groups/${selectedGroup.id}/schedule-dates?month=${
          selectedMonth.getMonth() + 1
        }&year=${selectedMonth.getFullYear()}`
      );
      const dates = await res.json();
      return dates.map((d: string) => new Date(d));
    },
    enabled: !!selectedGroup,
  });

  const { data: attendance } = useQuery<Attendance[]>({
    queryKey: [
      "/api/attendance",
      selectedGroup?.id,
      selectedMonth.getMonth() + 1,
      selectedMonth.getFullYear(),
    ],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const res = await apiRequest(
        "GET",
        `/api/attendance?groupId=${selectedGroup.id}&month=${
          selectedMonth.getMonth() + 1
        }&year=${selectedMonth.getFullYear()}`
      );
      return res.json();
    },
    enabled: !!selectedGroup,
  });

  const { data: dateComments } = useQuery<DateComment[]>({
    queryKey: [
      "/api/date-comments",
      selectedGroup?.id,
      selectedMonth.getMonth() + 1,
      selectedMonth.getFullYear(),
    ],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const res = await apiRequest(
        "GET",
        `/api/date-comments?groupId=${selectedGroup.id}&month=${
          selectedMonth.getMonth() + 1
        }&year=${selectedMonth.getFullYear()}`
      );
      return res.json();
    },
    enabled: !!selectedGroup,
  });

  return { students, scheduleDates, attendance, dateComments };
}
