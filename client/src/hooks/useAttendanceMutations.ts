
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AttendanceStatus } from "@shared/schema";
import { apiRequest } from "@/lib/apiRequest";
import { useToast } from "@/components/ui/use-toast";

export const useAttendanceMutations = (
  selectedGroup: { id: number } | null,
  selectedMonth: Date
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const dateCommentMutation = useMutation({
    mutationFn: async (data: {
      groupId: number;
      date: string;
      comment?: string;
      commentId?: number;
      action?: "delete";
    }) => {
      if (data.action === "delete" && data.commentId) {
        const res = await apiRequest(
          "DELETE",
          `/api/date-comments/${data.commentId}`
        );
        if (!res.ok) throw new Error("Failed to delete comment");
        return { action: "delete" };
      }

      if (data.commentId) {
        const res = await apiRequest(
          "PATCH",
          `/api/date-comments/${data.commentId}`,
          { comment: data.comment }
        );
        if (!res.ok) throw new Error("Failed to update comment");
        return res.json();
      }

      const res = await apiRequest("POST", "/api/date-comments", data);
      if (!res.ok) throw new Error("Failed to create comment");
      return res.json();
    },
    onSuccess: (result, variables) => {
      queryClient.refetchQueries({
        queryKey: [
          "/api/date-comments",
          selectedGroup?.id,
          selectedMonth.getMonth() + 1,
          selectedMonth.getFullYear(),
        ],
        exact: true,
      });

      if (variables.action === "delete") {
        toast({
          title: "Успешно",
          description: "Комментарий удален",
        });
      } else if (variables.commentId) {
        toast({
          title: "Успешно",
          description: "Комментарий обновлен",
        });
      } else {
        toast({
          title: "Успешно",
          description: "Комментарий сохранен",
        });
      }
    },
    onError: (error) => {
      console.error("Error saving comment:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить комментарий",
        variant: "destructive",
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
      toast({
        title: "Успешно",
        description: "Посещаемость обновлена",
      });
    },
  });

  return {
    dateCommentMutation,
    bulkAttendanceMutation,
  };
};
