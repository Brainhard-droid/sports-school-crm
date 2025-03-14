
import { useQuery } from "@tanstack/react-query";
import { Group, Student, Attendance, DateComment } from "@shared/schema";
import { apiRequest } from "@/lib/apiRequest";

export const useAttendanceData = (
  selectedGroup: Group | null,
  selectedMonth: Date
) => {
  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/groups");
      return res.json();
    },
  });

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
      "/api/groups/:groupId/schedule-dates",
      selectedGroup?.id,
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

  return {
    groups,
    students,
    scheduleDates,
    attendance,
    dateComments,
  };
};
