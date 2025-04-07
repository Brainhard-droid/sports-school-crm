import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StudentForm } from "./student-form";

interface CreateStudentDialogProps {
  onSuccess?: () => void;
}

export function CreateStudentDialog({ onSuccess }: CreateStudentDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Добавить ученика
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить нового ученика</DialogTitle>
        </DialogHeader>
        <StudentForm 
          mode="create"
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}