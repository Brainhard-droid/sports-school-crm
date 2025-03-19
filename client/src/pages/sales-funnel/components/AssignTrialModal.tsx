import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AssignTrialModalProps {
  request: ExtendedTrialRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignTrialModal({ request, isOpen, onClose, onSuccess }: AssignTrialModalProps) {
  const { toast } = useToast();
  const [scheduledDate, setScheduledDate] = useState<string>("");

  const assignTrialMutation = useMutation({
    mutationFn: async () => {
      if (!request) return;

      const res = await apiRequest("PUT", `/api/trial-requests/${request.id}`, {
        status: TrialRequestStatus.TRIAL_ASSIGNED,
        scheduledDate: new Date(scheduledDate).toISOString(),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Ошибка при назначении пробного занятия");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Пробное занятие назначено",
        description: "Уведомление отправлено родителю",
      });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Назначить пробное занятие</DialogTitle>
          <DialogDescription>
            Выберите дату пробного занятия для {request.childName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Дата занятия</Label>
            <Input
              id="scheduledDate"
              type="datetime-local"
              min={new Date().toISOString().split('T')[0]}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={() => assignTrialMutation.mutate()}
              disabled={!scheduledDate || assignTrialMutation.isPending}
            >
              {assignTrialMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Подтвердить"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExtendedTrialRequest } from "@shared/schema";
import { useState } from "react";

interface AssignTrialModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  request: ExtendedTrialRequest | null;
}

export function AssignTrialModal({ open, onClose, onConfirm, request }: AssignTrialModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleConfirm = () => {
    if (date && time) {
      const dateTime = new Date(`${date}T${time}`);
      onConfirm(dateTime);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Назначить пробное занятие</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label>Дата занятия</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label>Время занятия</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleConfirm}>
              Подтвердить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
