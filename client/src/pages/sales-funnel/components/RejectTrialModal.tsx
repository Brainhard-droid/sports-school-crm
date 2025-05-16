import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useTrialRequests } from "../hooks/useTrialRequests";

// Определяем наиболее частые причины отказа
const commonReasons = [
  { id: 'price', label: 'Высокая стоимость' },
  { id: 'schedule', label: 'Не подходит расписание' },
  { id: 'location', label: 'Неудобное расположение' },
  { id: 'trainer', label: 'Не понравился тренер' },
  { id: 'format', label: 'Не подходит формат занятий' },
  { id: 'competition', label: 'Выбрали другую школу' },
  { id: 'health', label: 'Проблемы со здоровьем' },
  { id: 'interest', label: 'Ребенку не понравилось' },
] as const;

interface RejectTrialModalProps {
  request: ExtendedTrialRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RejectTrialModal({
  request,
  isOpen,
  onClose,
  onSuccess,
}: RejectTrialModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Получаем доступ к функции обновления статуса
  const { updateStatus } = useTrialRequests();
  
  // Состояние для чекбоксов
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState<string>('');
  
  // Мутация для обновления статуса
  const rejectTrialMutation = useMutation({
    mutationFn: async () => {
      if (!request) return;
      
      // Формируем текст примечания с причинами отказа
      let notes = 'Причины отказа: ';
      
      if (selectedReasons.length > 0) {
        notes += selectedReasons.map(reasonId => {
          const reason = commonReasons.find(r => r.id === reasonId);
          return reason ? reason.label : reasonId;
        }).join(', ');
      }
      
      if (customReason.trim()) {
        notes += selectedReasons.length > 0 ? `. ${customReason}` : customReason;
      }
      
      console.log('Отправка запроса на отклонение заявки:', request.id, 'с примечанием:', notes);
      
      // Используем функцию обновления статуса из хука useTrialRequests
      updateStatus({
        id: request.id,
        status: TrialRequestStatus.REFUSED,
        notes
      });
      
      return request;
    },
    onSuccess: () => {
      toast({
        title: "Заявка отклонена",
        description: "Статус заявки успешно изменен на 'Отказ'",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
      onSuccess();
      onClose();
      
      // Сбрасываем состояние формы
      setSelectedReasons([]);
      setCustomReason('');
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Обработка изменения чекбокса
  const handleReasonToggle = (reasonId: string) => {
    setSelectedReasons(prev => {
      if (prev.includes(reasonId)) {
        return prev.filter(id => id !== reasonId);
      } else {
        return [...prev, reasonId];
      }
    });
  };

  // Обработка отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем, что выбрана хотя бы одна причина или заполнено примечание
    if (selectedReasons.length === 0 && !customReason.trim()) {
      toast({
        title: "Внимание",
        description: "Укажите хотя бы одну причину отказа",
        variant: "destructive",
      });
      return;
    }
    
    rejectTrialMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Отказ от пробного занятия</DialogTitle>
          <DialogDescription>
            {request ? `Укажите причину отказа для ${request.childName}` : 'Укажите причину отказа'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Частые причины отказа:</h4>
            <div className="grid grid-cols-2 gap-3">
              {commonReasons.map((reason) => (
                <div key={reason.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={reason.id} 
                    checked={selectedReasons.includes(reason.id)}
                    onCheckedChange={() => handleReasonToggle(reason.id)}
                  />
                  <Label htmlFor={reason.id} className="cursor-pointer">{reason.label}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customReason">Дополнительный комментарий</Label>
            <Textarea
              id="customReason"
              placeholder="Укажите дополнительную информацию или другую причину отказа..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="resize-none"
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={rejectTrialMutation.isPending}
            >
              Отмена
            </Button>
            <Button 
              type="submit"
              disabled={rejectTrialMutation.isPending}
            >
              {rejectTrialMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}