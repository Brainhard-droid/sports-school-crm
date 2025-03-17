import { useQuery, useMutation } from "@tanstack/react-query";
import { Attendance, AttendanceStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface UseAttendanceProps {
  groupId: number;
  month: Date;
}

export function useAttendance({ groupId, month }: UseAttendanceProps) {
  const queryKey = [
    "/api/attendance",
    groupId,
    month.getMonth() + 1,
    month.getFullYear(),
  ];

  const { data: attendance = [], isLoading } = useQuery<Attendance[]>({
    queryKey,
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
      const existingAttendance = attendance?.find(
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

  return {
    attendance,
    isLoading,
    markAttendance: markAttendanceMutation.mutateAsync,
    bulkAttendance: bulkAttendanceMutation.mutateAsync,
  };
}