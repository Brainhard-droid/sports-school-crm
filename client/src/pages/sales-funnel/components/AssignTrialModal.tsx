import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AssignTrialModalProps {
  request: ExtendedTrialRequest | null;
  open: boolean;
  onClose: () => void;
}

export function AssignTrialModal({ request, open, onClose }: AssignTrialModalProps) {
  const [scheduledDate, setScheduledDate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        description: "Информация успешно обновлена",
      });
      queryClient.invalidateQueries({ queryKey: ["trialRequests"] });
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Назначить пробное занятие</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Дата занятия</Label>
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
              onClick={() => assignTrialMutation.mutate()}
              disabled={assignTrialMutation.isPending || !scheduledDate}
            >
              {assignTrialMutation.isPending ? (
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