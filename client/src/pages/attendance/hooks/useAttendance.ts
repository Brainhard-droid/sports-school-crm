import { useQuery, useMutation } from "@tanstack/react-query";
import { Attendance, AttendanceStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface UseAttendanceProps {
  groupId: number;
  month: Date;
}

export function useAttendance({ groupId, month }: UseAttendanceProps) {
  const { toast } = useToast();
  
  const attendanceQuery = useQuery<Attendance[]>({
    queryKey: [
      "/api/attendance",
      groupId,
      month.getMonth() + 1,
      month.getFullYear(),
    ],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/attendance?groupId=${groupId}&month=${
          month.getMonth() + 1
        }&year=${month.getFullYear()}`
      );
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
      const existingAttendance = attendanceQuery.data?.find(
        (a) =>
          a.studentId === studentId &&
          format(new Date(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      );

      if (existingAttendance) {
        const res = await apiRequest("PATCH", `/api/attendance/${existingAttendance.id}`, {
          status,
        });
        return res.json();
      } else {
        const newAttendance = {
          studentId,
          groupId,
          date: format(date, "yyyy-MM-dd"),
          status,
        };
        const res = await apiRequest("POST", "/api/attendance", newAttendance);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "/api/attendance",
          groupId,
          month.getMonth() + 1,
          month.getFullYear(),
        ],
      });
    },
    onError: (error) => {
      console.error('Error marking attendance:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отметить посещаемость",
        variant: "destructive",
      });
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
      queryClient.refetchQueries({
        queryKey: [
          "/api/attendance",
          groupId,
          month.getMonth() + 1,
          month.getFullYear(),
        ],
        exact: true,
      });
      toast({
        title: "Успешно",
        description: "Посещаемость обновлена",
      });
    },
  });

  return {
    attendance: attendanceQuery.data ?? [],
    markAttendance: markAttendanceMutation.mutate,
    bulkAttendance: bulkAttendanceMutation.mutate,
    isLoading: attendanceQuery.isLoading,
  };
}
