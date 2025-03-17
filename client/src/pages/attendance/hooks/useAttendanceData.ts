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
      console.log('Fetching attendance data for:', { groupId, month: month.getMonth() + 1, year: month.getFullYear() });
      const res = await apiRequest(
        "GET",
        `/api/attendance?groupId=${groupId}&month=${
          month.getMonth() + 1
        }&year=${month.getFullYear()}`
      );
      if (!res.ok) {
        console.error('Failed to fetch attendance data:', await res.text());
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
      date,
      status,
    }: {
      studentId: number;
      date: Date;
      status: keyof typeof AttendanceStatus;
    }) => {
      console.log('Marking attendance:', { studentId, date, status });
      const existingAttendance = attendance.find(
        (a) =>
          a.studentId === studentId &&
          format(new Date(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      );

      let res;
      if (existingAttendance) {
        console.log('Updating existing attendance:', existingAttendance.id);
        res = await apiRequest("PATCH", `/api/attendance/${existingAttendance.id}`, {
          status,
        });
      } else {
        console.log('Creating new attendance record');
        res = await apiRequest("POST", "/api/attendance", {
          studentId,
          groupId,
          date: format(date, "yyyy-MM-dd"),
          status,
        });
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Attendance mutation failed:', errorText);
        throw new Error('Failed to update attendance');
      }

      const data = await res.json();
      console.log('Attendance mutation success:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Invalidating queries after attendance update');
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
      console.log('Updating bulk attendance:', { date, status });
      const res = await apiRequest("POST", "/api/attendance/bulk", {
        groupId,
        date: format(date, "yyyy-MM-dd"),
        status,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Bulk attendance mutation failed:', errorText);
        throw new Error('Failed to update bulk attendance');
      }

      const data = await res.json();
      console.log('Bulk attendance mutation success:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Invalidating queries after bulk attendance update');
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Calculate statistics for each student
  const calculateStatistics = (studentId: number) => {
    if (!attendance.length) {
      console.log('No attendance data available for statistics');
      return { percentage: 0, ratio: '0/0', formatted: '0% (0/0)' };
    }

    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    console.log('Calculating statistics for student:', { 
      studentId, 
      totalAttendanceRecords: studentAttendance.length 
    });

    // Get unique dates from all attendance records
    const uniqueDates = new Set(attendance.map(a => format(new Date(a.date), "yyyy-MM-dd")));
    const totalDates = uniqueDates.size;

    // Count unique dates where student was present
    const presentDates = new Set(
      studentAttendance
        .filter(a => a.status === AttendanceStatus.PRESENT)
        .map(a => format(new Date(a.date), "yyyy-MM-dd"))
    ).size;

    const percentage = totalDates > 0 ? Math.round((presentDates / totalDates) * 100) : 0;

    console.log('Statistics calculated:', { 
      studentId, 
      totalDates, 
      presentDates, 
      percentage 
    });

    return {
      percentage,
      ratio: `${presentDates}/${totalDates}`,
      formatted: `${percentage}% (${presentDates}/${totalDates})`
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