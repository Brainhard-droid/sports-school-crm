import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

const CommentDialog = ({ isOpen, onClose, date, existingComment, onSave }: CommentDialogProps) => {
  const [comment, setComment] = useState(existingComment?.comment || "");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Комментарий к {format(date, "d MMMM yyyy", { locale: ru })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Введите комментарий..."
          />
          <Button onClick={() => onSave(comment)}>Сохранить</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;
