import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DateComment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const useComments = (groupId?: number, month?: number, year?: number) => {
  const { toast } = useToast();

  const queryKey = ["/api/date-comments", groupId, month, year];

  const { data: dateComments = [], isLoading } = useQuery<DateComment[]>({
    queryKey,
    queryFn: async () => {
      if (!groupId) return [];

      console.log('Fetching comments:', { groupId, month, year });
      const res = await apiRequest(
        "GET",
        `/api/date-comments?groupId=${groupId}&month=${month}&year=${year}`
      );

      if (!res.ok) {
        const error = await res.text();
        console.error('Failed to fetch comments:', error);
        throw new Error('Failed to fetch comments');
      }

      const data = await res.json();
      console.log('Received comments:', data);
      return data;
    },
    enabled: !!groupId,
  });

  const commentMutation = useMutation({
    mutationFn: async (data: { 
      groupId: number; 
      date: string; 
      comment: string;
      commentId?: number;
      action?: 'delete';
    }) => {
      console.log('Comment mutation started:', data);

      let res;
      if (data.action === 'delete' && data.commentId) {
        console.log('Deleting comment:', data.commentId);
        res = await apiRequest("DELETE", `/api/date-comments/${data.commentId}`);
      } else if (data.commentId) {
        console.log('Updating comment:', data.commentId);
        res = await apiRequest(
          "PATCH", 
          `/api/date-comments/${data.commentId}`, 
          { comment: data.comment }
        );
      } else {
        console.log('Creating new comment:', {
          groupId: data.groupId,
          date: data.date,
          comment: data.comment
        });
        res = await apiRequest("POST", "/api/date-comments", {
          groupId: data.groupId,
          date: format(new Date(data.date), "yyyy-MM-dd"),
          comment: data.comment
        });
      }

      if (!res.ok) {
        const error = await res.text();
        console.error('Comment mutation failed:', error);
        throw new Error('Failed to process comment');
      }

      if (data.action === 'delete') {
        console.log('Comment deleted successfully');
        return;
      }

      const result = await res.json();
      console.log('Comment mutation success:', result);
      return result;
    },
    onSuccess: (_, variables) => {
      console.log('Invalidating queries after comment mutation');
      queryClient.invalidateQueries({ queryKey });

      toast({
        title: "Успешно",
        description: variables.action === 'delete'
          ? "Комментарий удалён"
          : variables.commentId
          ? "Комментарий обновлён"
          : "Комментарий добавлен",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Comment mutation error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить операцию с комментарием",
        variant: "destructive",
      });
    }
  });

  return { dateComments, isLoading, commentMutation };
};