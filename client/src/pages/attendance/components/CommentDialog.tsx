import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { DateComment } from "@shared/schema";

interface CommentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  groupId: number;
  existingComment?: DateComment;
  onSave: (comment: string) => void;
}

export function CommentDialog({
  isOpen,
  onClose,
  date,
  existingComment,
  onSave,
}: CommentDialogProps) {
  const [comment, setComment] = useState(existingComment?.comment || "");

  // Reset comment when dialog opens with new data
  useEffect(() => {
    setComment(existingComment?.comment || "");
  }, [existingComment, isOpen]);

  const handleSave = () => {
    onSave(comment);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingComment ? "Изменить" : "Добавить"} комментарий к{" "}
            {format(date, "d MMMM yyyy", { locale: ru })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Введите комментарий..."
            autoFocus
          />
          <Button onClick={handleSave}>Сохранить</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}