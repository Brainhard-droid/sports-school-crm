import { Student } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StudentForm } from "./student-form";

interface EditStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditStudentDialog({ 
  student, 
  open, 
  onOpenChange,
  onSuccess
}: EditStudentDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать данные ученика</DialogTitle>
        </DialogHeader>
        {student && (
          <StudentForm 
            student={student}
            mode="edit"
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}