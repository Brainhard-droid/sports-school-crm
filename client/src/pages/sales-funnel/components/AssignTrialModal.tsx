import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useTrialRequests } from "../hooks/useTrialRequests";

interface AssignTrialModalProps {
  request: ExtendedTrialRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AssignTrialModal({ request, isOpen, onClose, onSuccess }: AssignTrialModalProps) {
  const [scheduledDate, setScheduledDate] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { updateStatus } = useTrialRequests();

  useEffect(() => {
    if (request?.desiredDate) {
      // Преобразуем дату в формат datetime-local
      const date = new Date(request.desiredDate);
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      setScheduledDate(localDate.toISOString().slice(0, 16));
    }
  }, [request]);

  const handleSubmit = async () => {
    if (!request) return;

    setIsLoading(true);
    try {
      await updateStatus({
        id: request.id,
        status: TrialRequestStatus.TRIAL_ASSIGNED,
        scheduledDate: new Date(scheduledDate)
      });

      toast({
        title: "Пробное занятие назначено",
        description: "Информация успешно обновлена",
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error assigning trial:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось назначить пробное занятие",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>Назначить пробное занятие</DialogTitle>
          <DialogDescription>
            Выберите дату и время пробного занятия для {request?.childName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Дата и время занятия</Label>
            <Input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !scheduledDate}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Назначить"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}