import { useQuery, useMutation } from "@tanstack/react-query";
import { DateComment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface UseCommentsProps {
  groupId: number;
  month: Date;
}

export function useComments({ groupId, month }: UseCommentsProps) {
  const queryKey = [
    "/api/date-comments",
    groupId,
    month.getMonth() + 1,
    month.getFullYear(),
  ];

  const { data: comments = [], isLoading } = useQuery<DateComment[]>({
    queryKey,
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/date-comments?groupId=${groupId}&month=${
          month.getMonth() + 1
        }&year=${month.getFullYear()}`
      );
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    enabled: !!groupId,
  });

  const commentMutation = useMutation({
    mutationFn: async ({
      date,
      comment,
      commentId,
      action,
    }: {
      date: Date;
      comment: string;
      commentId?: number;
      action?: 'delete';
    }) => {
      if (action === 'delete' && commentId) {
        const res = await apiRequest("DELETE", `/api/date-comments/${commentId}`);
        if (!res.ok) throw new Error('Failed to delete comment');
        return;
      } else if (commentId) {
        const res = await apiRequest("PATCH", `/api/date-comments/${commentId}`, { comment });
        if (!res.ok) throw new Error('Failed to update comment');
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/date-comments", {
          groupId,
          date: format(date, "yyyy-MM-dd"),
          comment,
        });
        if (!res.ok) throw new Error('Failed to create comment');
        return res.json();
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Успешно",
        description: variables.action === 'delete' 
          ? "Комментарий удален" 
          : variables.commentId 
            ? "Комментарий обновлен"
            : "Комментарий сохранен"
      });
    },
    onError: (error) => {
      console.error('Comment mutation error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить комментарий",
        variant: "destructive"
      });
    }
  });

  return {
    comments,
    isLoading,
    manageComment: commentMutation.mutateAsync,
  };
}