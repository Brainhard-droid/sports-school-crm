import { useQuery, useMutation } from "@tanstack/react-query";
import { Attendance, AttendanceStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface UseAttendanceDataProps {
  groupId: number;
  month: Date;
}

export function useAttendanceData({ groupId, month }: UseAttendanceDataProps) {
  const queryKey = [
    "/api/attendance",
    groupId,
    month.getMonth() + 1,
    month.getFullYear(),
  ];

  const { data: attendance = [], isLoading } = useQuery<Attendance[]>({
    queryKey,
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/attendance?groupId=${groupId}&month=${
          month.getMonth() + 1
        }&year=${month.getFullYear()}`
      );
      if (!res.ok) throw new Error('Failed to fetch attendance data');
      return res.json();
    },
    enabled: !!groupId,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({
      studentId,
      date,
      status,
    }: {
      studentId: number;
      date: Date;
      status: keyof typeof AttendanceStatus;
    }) => {
      const existingAttendance = attendance.find(
        (a) =>
          a.studentId === studentId &&
          format(new Date(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      );

      if (existingAttendance) {
        const res = await apiRequest("PATCH", `/api/attendance/${existingAttendance.id}`, {
          status,
        });
        if (!res.ok) throw new Error('Failed to update attendance');
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/attendance", {
          studentId,
          groupId,
          date: format(date, "yyyy-MM-dd"),
          status,
        });
        if (!res.ok) throw new Error('Failed to create attendance');
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const bulkAttendanceMutation = useMutation({
    mutationFn: async ({
      date,
      status,
    }: {
      date: Date;
      status: keyof typeof AttendanceStatus;
    }) => {
      const res = await apiRequest("POST", "/api/attendance/bulk", {
        groupId,
        date: format(date, "yyyy-MM-dd"),
        status,
      });
      if (!res.ok) throw new Error('Failed to update bulk attendance');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Calculate statistics for each student
  const calculateStatistics = (studentId: number) => {
    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    const totalClasses = studentAttendance.length;
    const presentClasses = studentAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
    return {
      percentage,
      ratio: `${presentClasses}/${totalClasses}`,
      formatted: `${percentage}% (${presentClasses}/${totalClasses})`
    };
  };

  return {
    attendance,
    isLoading,
    markAttendance: markAttendanceMutation.mutateAsync,
    bulkAttendance: bulkAttendanceMutation.mutateAsync,
    calculateStatistics,
  };
}
