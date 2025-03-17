import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AttendanceStatus } from "@shared/schema";

export const useBulkAttendance = (groupId?: number, month?: number, year?: number) => {
  const bulkAttendanceMutation = useMutation({
    mutationFn: async (data: {
      groupId: number;
      date: string;
      status: keyof typeof AttendanceStatus;
    }) => {
      const res = await apiRequest("POST", "/api/attendance/bulk", data);
      if (!res.ok) throw new Error('Failed to update bulk attendance');
      return res.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["/api/attendance", groupId, month, year],
        exact: true,
      });
    },
  });

  return { bulkAttendanceMutation };
};