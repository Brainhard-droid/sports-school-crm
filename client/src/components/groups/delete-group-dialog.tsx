import { useMutation } from "@tanstack/react-query";
import { Group } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteGroupDialogProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteGroupDialog({
  group,
  open,
  onOpenChange,
}: DeleteGroupDialogProps) {
  const { toast } = useToast();

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to delete group');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      onOpenChange(false);
      toast({
        title: "Успешно",
        description: "Группа удалена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteGroup = async () => {
    if (!group) return;
    await deleteGroupMutation.mutateAsync(group.id);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
          <AlertDialogDescription>
            Это действие не может быть отменено. Группа "{group?.name}" и все связанные с ней данные будут удалены навсегда.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteGroup}>
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}