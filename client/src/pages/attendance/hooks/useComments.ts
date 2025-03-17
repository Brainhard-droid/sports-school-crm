import { useQuery, useMutation } from "@tanstack/react-query";
import { DateComment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface UseCommentsProps {
  groupId: number;
  month: Date;
}

export function useComments({ groupId, month }: UseCommentsProps) {
  const { toast } = useToast();

  const commentsQuery = useQuery<DateComment[]>({
    queryKey: [
      "/api/date-comments",
      groupId,
      month.getMonth() + 1,
      month.getFullYear(),
    ],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/date-comments?groupId=${groupId}&month=${
          month.getMonth() + 1
        }&year=${month.getFullYear()}`
      );
      return res.json();
    },
    enabled: !!groupId,
  });

  const commentMutation = useMutation({
    mutationFn: async (data: { 
      date: Date;
      comment: string;
      commentId?: number;
      action?: 'delete';
    }) => {
      if (data.action === 'delete' && data.commentId) {
        const res = await apiRequest(
          "DELETE",
          `/api/date-comments/${data.commentId}`
        );
        if (!res.ok) {
          throw new Error('Failed to delete comment');
        }
        return;
      } else if (data.commentId) {
        const res = await apiRequest(
          "PATCH", 
          `/api/date-comments/${data.commentId}`, 
          { comment: data.comment }
        );
        if (!res.ok) {
          throw new Error('Failed to update comment');
        }
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/date-comments", {
          groupId,
          date: format(data.date, "yyyy-MM-dd"),
          comment: data.comment
        });
        if (!res.ok) {
          throw new Error('Failed to create comment');
        }
        return res.json();
      }
    },
    onSuccess: (_, variables) => {
      queryClient.refetchQueries({
        queryKey: [
          "/api/date-comments",
          groupId,
          month.getMonth() + 1,
          month.getFullYear(),
        ],
        exact: true,
      });
      
      toast({
        title: "Успешно",
        description: variables.action === "delete" 
          ? "Комментарий удален"
          : variables.commentId 
            ? "Комментарий обновлен" 
            : "Комментарий сохранен",
      });
    },
    onError: (error) => {
      console.error('Error managing comment:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить действие с комментарием",
        variant: "destructive",
      });
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    manageComment: commentMutation.mutate,
    isLoading: commentsQuery.isLoading,
  };
}
