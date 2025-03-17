// useAttendanceMutations.ts
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AttendanceStatus } from "@shared/schema";

export function useAttendanceMutations(selectedGroup: any, selectedMonth: Date) {
  const dateCommentMutation = useMutation({
    mutationFn: async (data: { 
      groupId: number; 
      date: string; 
      comment: string;
      commentId?: number;
      action?: 'delete';
    }) => {
      if (data.action === "delete" && data.commentId) {
        const res = await apiRequest("DELETE", `/api/date-comments/${data.commentId}`);
        if (!res.ok) throw new Error("Failed to delete comment");
        return;
      } else if (data.commentId) {
        const res = await apiRequest("PATCH", `/api/date-comments/${data.commentId}`, { comment: data.comment });
        if (!res.ok) throw new Error("Failed to update comment");
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/date-comments", {
          groupId: data.groupId,
          date: data.date,
          comment: data.comment,
        });
        if (!res.ok) throw new Error("Failed to create comment");
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: [
          "/api/date-comments",
          selectedGroup?.id,
          selectedMonth.getMonth() + 1,
          selectedMonth.getFullYear(),
        ],
        exact: true,
      });
    },
  });

  const bulkAttendanceMutation = useMutation({
    mutationFn: async (data: {
      groupId: number;
      date: string;
      status: keyof typeof AttendanceStatus;
    }) => {
      const res = await apiRequest("POST", "/api/attendance/bulk", data);
      if (!res.ok) throw new Error("Failed to update bulk attendance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: [
          "/api/attendance",
          selectedGroup?.id,
          selectedMonth.getMonth() + 1,
          selectedMonth.getFullYear(),
        ],
        exact: true,
      });
    },
  });

  return { dateCommentMutation, bulkAttendanceMutation };
}
