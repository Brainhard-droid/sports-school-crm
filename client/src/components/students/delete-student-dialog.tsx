import { useMutation } from "@tanstack/react-query";
import { Student } from "@shared/schema";
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

interface DeleteStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteStudentDialog({
  student,
  open,
  onOpenChange,
}: DeleteStudentDialogProps) {
  const { toast } = useToast();

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to delete student');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      onOpenChange(false);
      toast({
        title: "Успешно",
        description: "Ученик удален",
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

  const handleDeleteStudent = async () => {
    if (!student) return;
    await deleteStudentMutation.mutateAsync(student.id);
  };

  const studentFullName = student ? `${student.firstName} ${student.lastName}` : '';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
          <AlertDialogDescription>
            Это действие не может быть отменено. Ученик "{studentFullName}" и все связанные с ним данные будут удалены навсегда.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteStudent}>
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}