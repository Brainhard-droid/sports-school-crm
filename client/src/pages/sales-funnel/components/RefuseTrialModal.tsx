import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { useTrialRequests } from "../hooks/useTrialRequests";
import { Loader2 } from "lucide-react";

// Популярные причины отказа
const refuseReasons = [
  { id: "price", label: "Высокая стоимость" },
  { id: "location", label: "Неудобное расположение филиала" },
  { id: "schedule", label: "Неподходящее расписание занятий" },
  { id: "competitor", label: "Выбрали другую школу" },
  { id: "not_interested", label: "Потеряли интерес к данному виду спорта" },
  { id: "age", label: "Возрастные ограничения" },
  { id: "health", label: "Проблемы со здоровьем" },
  { id: "transport", label: "Транспортные сложности" },
];

interface RefuseTrialModalProps {
  request: ExtendedTrialRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Модальное окно для отказа от заявки
 * Следует принципу единственной ответственности (SRP) - отвечает только за ввод причины отказа
 */
export function RefuseTrialModal({ request, isOpen, onClose, onSuccess }: RefuseTrialModalProps) {
  const { toast } = useToast();
  const { updateStatus } = useTrialRequests();
  const [isLoading, setIsLoading] = useState(false);
  
  // Состояние выбранных причин
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState("");
  
  // Сброс состояния при открытии
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
    if (open) {
      // Сбрасываем выбранные причины при каждом открытии
      setSelectedReasons([]);
      setCustomReason("");
    }
  };
  
  // Обработчик изменения чекбокса
  const handleReasonToggle = (reasonId: string, checked: boolean) => {
    if (checked) {
      setSelectedReasons(prev => [...prev, reasonId]);
    } else {
      setSelectedReasons(prev => prev.filter(id => id !== reasonId));
    }
  };
  
  // Отправка формы
  const handleSubmit = async () => {
    if (!request) return;
    
    // Формируем сообщение с причинами отказа
    let refuseMessage = "";
    
    // Добавляем выбранные причины
    if (selectedReasons.length > 0) {
      const selectedLabels = selectedReasons.map(id => 
        refuseReasons.find(reason => reason.id === id)?.label
      ).filter(Boolean);
      
      refuseMessage += "Причины отказа:\n";
      selectedLabels.forEach(label => {
        refuseMessage += `- ${label}\n`;
      });
    }
    
    // Добавляем пользовательский комментарий, если он есть
    if (customReason.trim()) {
      if (selectedReasons.length > 0) refuseMessage += "\n";
      refuseMessage += `Комментарий: ${customReason.trim()}`;
    }
    
    // Если нет причин, показываем предупреждение
    if (!refuseMessage.trim()) {
      toast({
        title: "Укажите причину отказа",
        description: "Пожалуйста, выберите причину отказа или оставьте комментарий",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Обновляем статус заявки и добавляем комментарий в notes
      await updateStatus({
        id: request.id,
        status: TrialRequestStatus.REFUSED,
        refuseReason: refuseMessage
      });
      
      toast({
        title: "Заявка отклонена",
        description: "Информация об отказе успешно сохранена",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error refusing trial request:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось отклонить заявку",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Указать причину отказа</DialogTitle>
          <DialogDescription>
            {request ? 
              `Укажите причину отказа для заявки от ${request.parentName} (${request.childName})` : 
              'Укажите причину отказа'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Выберите причину отказа:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {refuseReasons.map((reason) => (
                <div key={reason.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={reason.id} 
                    checked={selectedReasons.includes(reason.id)}
                    onCheckedChange={(checked) => 
                      handleReasonToggle(reason.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={reason.id} className="cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment">Дополнительный комментарий:</Label>
            <Textarea
              id="comment"
              placeholder="Укажите дополнительную информацию..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Подтвердить отказ"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}