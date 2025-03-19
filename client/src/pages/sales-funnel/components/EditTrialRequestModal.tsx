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
import { ExtendedTrialRequest } from "@shared/schema";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { AssignTrialModal } from "./AssignTrialModal";

interface EditTrialRequestModalProps {
  request: ExtendedTrialRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTrialRequestModal({
  request,
  isOpen,
  onClose,
  onSuccess,
}: EditTrialRequestModalProps) {
  const { toast } = useToast();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [formData, setFormData] = useState({
    childName: request?.childName || "",
    childAge: request?.childAge || 0,
    parentName: request?.parentName || "",
    parentPhone: request?.parentPhone || "",
  });

  const updateTrialRequestMutation = useMutation({
    mutationFn: async () => {
      if (!request) return;

      const res = await apiRequest("PUT", `/api/trial-requests/${request.id}`, formData);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Ошибка при обновлении заявки");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Заявка обновлена",
        description: "Данные заявки успешно обновлены",
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Просмотр заявки</DialogTitle>
            <DialogDescription>
              Информация о заявке на пробное занятие
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ФИО ребенка</Label>
              <Input
                value={formData.childName}
                onChange={(e) => setFormData(prev => ({ ...prev, childName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Возраст</Label>
              <Input
                type="number"
                value={formData.childAge}
                onChange={(e) => setFormData(prev => ({ ...prev, childAge: parseInt(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>ФИО родителя</Label>
              <Input
                value={formData.parentName}
                onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Телефон родителя</Label>
              <Input
                value={formData.parentPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Секция</Label>
              <div className="text-sm text-muted-foreground">{request.section?.name}</div>
            </div>

            <div className="space-y-2">
              <Label>Филиал</Label>
              <div className="text-sm text-muted-foreground">{request.branch?.name}</div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAssignModal(true)}
              >
                Назначить пробное
              </Button>
              <Button
                onClick={() => updateTrialRequestMutation.mutate()}
                disabled={updateTrialRequestMutation.isPending}
              >
                {updateTrialRequestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить изменения"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AssignTrialModal
        request={request}
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          onClose();
        }}
        onSuccess={onSuccess}
      />
    </>
  );
}