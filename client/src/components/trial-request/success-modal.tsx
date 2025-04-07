import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

type SuccessModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SuccessModal = ({ open, onOpenChange }: SuccessModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Заявка успешно отправлена
          </DialogTitle>
          <DialogDescription>
            Мы свяжемся с вами в ближайшее время для подтверждения пробного занятия
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};