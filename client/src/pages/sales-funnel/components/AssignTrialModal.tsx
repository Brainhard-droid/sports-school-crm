import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/api";

interface AssignTrialModalProps {
  request: ExtendedTrialRequest | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AssignTrialModal({ request, open, onClose, onSuccess }: AssignTrialModalProps) {
  const [scheduledDate, setScheduledDate] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!request) return;

    setIsLoading(true);
    try {
      await apiRequest("PUT", `/api/trial-requests/${request.id}`, {
        status: TrialRequestStatus.TRIAL_ASSIGNED,
        scheduledDate: new Date(scheduledDate).toISOString(),
      });

      toast({
        title: "Пробное занятие назначено",
        description: "Информация успешно обновлена",
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось назначить пробное занятие",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Назначить пробное занятие</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
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