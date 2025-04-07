import { Dispatch, SetStateAction, useState } from "react";
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
  open?: boolean;
  onOpenChange?: Dispatch<SetStateAction<boolean>>;
  triggerButton?: boolean;
}

export function CreateStudentDialog({ 
  onSuccess, 
  open: controlledOpen, 
  onOpenChange: setControlledOpen,
  triggerButton = true 
}: CreateStudentDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  
  // Determine if we're in controlled or uncontrolled mode
  const isControlled = controlledOpen !== undefined && setControlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen : setUncontrolledOpen;

  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerButton && (
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Добавить ученика
          </Button>
        </DialogTrigger>
      )}
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