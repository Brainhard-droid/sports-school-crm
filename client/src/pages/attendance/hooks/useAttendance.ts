import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Attendance, AttendanceStatus } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export const useAttendance = (groupId?: number, month?: number, year?: number) => {
  const { toast } = useToast();

  const queryKey = ["/api/attendance", groupId, month, year];

  const { data: attendance = [], isLoading } = useQuery<Attendance[]>({
    queryKey,
    queryFn: async () => {
      if (!groupId) return [];

      console.log('Fetching attendance:', { groupId, month, year });
      const res = await apiRequest(
        "GET",
        `/api/attendance?groupId=${groupId}&month=${month}&year=${year}`
      );

      if (!res.ok) {
        const error = await res.text();
        console.error('Failed to fetch attendance:', error);
        throw new Error('Failed to fetch attendance data');
      }

      const data = await res.json();
      console.log('Received attendance data:', data);
      return data;
    },
    enabled: !!groupId,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({
      studentId,
      groupId,
      date,
      status,
    }: {
      studentId: number;
      groupId: number;
      date: string;
      status: keyof typeof AttendanceStatus;
    }) => {
      console.log('Marking attendance:', { studentId, groupId, date, status });

      const existingAttendance = attendance?.find(
        (a) =>
          a.studentId === studentId &&
          format(new Date(a.date), "yyyy-MM-dd") === date
      );

      if (existingAttendance) {
        console.log('Updating existing attendance:', existingAttendance.id);
        const res = await apiRequest(
          "PATCH", 
          `/api/attendance/${existingAttendance.id}`,
          { status }
        );

        if (!res.ok) {
          const error = await res.text();
          console.error('Failed to update attendance:', error);
          throw new Error('Failed to update attendance');
        }

        return res.json();
      } else {
        console.log('Creating new attendance record');
        const res = await apiRequest(
          "POST", 
          "/api/attendance",
          {
            studentId,
            groupId,
            date,
            status,
          }
        );

        if (!res.ok) {
          const error = await res.text();
          console.error('Failed to create attendance:', error);
          throw new Error('Failed to create attendance');
        }

        return res.json();
      }
    },
    onSuccess: () => {
      console.log('Attendance updated successfully');
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Успешно",
        description: "Посещаемость обновлена",
      });
    },
    onError: (error) => {
      console.error('Attendance mutation error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить посещаемость",
        variant: "destructive",
      });
    },
  });

  return { 
    attendance, 
    isLoading, 
    markAttendanceMutation
  };
};