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
      console.log('Fetching comments:', { 
        groupId, 
        month: month.getMonth() + 1, 
        year: month.getFullYear() 
      });

      const res = await apiRequest(
        "GET",
        `/api/date-comments?groupId=${groupId}&month=${
          month.getMonth() + 1
        }&year=${month.getFullYear()}`
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to fetch comments:', errorText);
        throw new Error('Failed to fetch comments');
      }

      const data = await res.json();
      console.log('Received comments:', data);
      return data;
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
      console.log('Comment mutation started:', { date, comment, commentId, action });

      let res;
      if (action === 'delete' && commentId) {
        console.log('Deleting comment:', commentId);
        res = await apiRequest("DELETE", `/api/date-comments/${commentId}`);
      } else if (commentId) {
        console.log('Updating comment:', commentId);
        res = await apiRequest("PATCH", `/api/date-comments/${commentId}`, { comment });
      } else {
        console.log('Creating new comment');
        res = await apiRequest("POST", "/api/date-comments", {
          groupId,
          date: format(date, "yyyy-MM-dd"),
          comment,
        });
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Comment mutation failed:', errorText);
        throw new Error('Failed to process comment');
      }

      if (action === 'delete') {
        console.log('Comment deleted successfully');
        return;
      }

      const data = await res.json();
      console.log('Comment mutation success:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      console.log('Invalidating queries after comment mutation');
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