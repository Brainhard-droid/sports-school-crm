import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { Loader2, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useTrialRequests } from "../hooks/useTrialRequests";
import { getNextLessonDates, formatDateTime } from "@/lib/utils/schedule";
import { format, parseISO } from "date-fns";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface AssignTrialModalProps {
  request: ExtendedTrialRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AssignTrialModal({ request, isOpen, onClose, onSuccess }: AssignTrialModalProps) {
  const [scheduledDate, setScheduledDate] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [useCustomDate, setUseCustomDate] = useState(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { updateStatus } = useTrialRequests();
  const [suggestedDates, setSuggestedDates] = useState<{date: Date, timeLabel: string}[]>([]);

  // Загрузка расписания для выбранной секции и филиала
  const { data: branchSchedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ["branch-schedule", request?.branchId, request?.sectionId],
    enabled: !!request?.branchId && !!request?.sectionId && isOpen,
    queryFn: async () => {
      if (!request?.branchId) return null;
      const res = await apiRequest(
        "GET", 
        `/api/branches-by-section?sectionId=${request.sectionId}&branchId=${request.branchId}`
      );
      const data = await res.json();
      return data[0]?.schedule ? JSON.parse(data[0].schedule) : null;
    }
  });

  useEffect(() => {
    if (request && branchSchedule) {
      // Генерируем 5 ближайших дат занятий на основе расписания
      const nextDates = getNextLessonDates(branchSchedule, 5);
      setSuggestedDates(nextDates);
      
      // Выбираем первую дату из списка или используем желаемую дату из заявки
      if (nextDates.length > 0) {
        setScheduledDate(formatDateTime(nextDates[0].date));
      } else if (request.desiredDate) {
        // Если нет подходящих дат, используем желаемую дату из заявки
        const desiredDate = new Date(request.desiredDate);
        setScheduledDate(formatDateTime(desiredDate));
        setCustomDate(formatDateTime(desiredDate));
        setUseCustomDate(true);
      }
    }
  }, [request, branchSchedule]);

  const handleSubmit = async () => {
    if (!request) return;

    const finalDate = useCustomDate ? customDate : scheduledDate;
    if (!finalDate) {
      toast({
        title: "Выберите дату",
        description: "Пожалуйста, выберите дату и время для пробного занятия",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateStatus({
        id: request.id,
        status: TrialRequestStatus.TRIAL_ASSIGNED,
        scheduledDate: new Date(finalDate)
      });

      toast({
        title: request.status === TrialRequestStatus.TRIAL_ASSIGNED ? "Пробное занятие перенесено" : "Пробное занятие назначено",
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
      <DialogContent className="w-[90vw] max-w-md">
        <DialogHeader>
          <DialogTitle>
            {request?.status === TrialRequestStatus.TRIAL_ASSIGNED
              ? "Перенести пробное занятие"
              : "Назначить пробное занятие"}
          </DialogTitle>
          <DialogDescription>
            Выберите дату и время пробного занятия для {request?.childName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {scheduleLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : suggestedDates.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label>Ближайшие даты по расписанию</Label>
                <RadioGroup 
                  value={useCustomDate ? "" : scheduledDate}
                  onValueChange={(value) => {
                    if (value) {
                      setScheduledDate(value);
                      setUseCustomDate(false);
                    }
                  }}
                  className="flex flex-col space-y-2"
                >
                  {suggestedDates.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 border rounded-md p-3">
                      <RadioGroupItem value={formatDateTime(item.date)} id={`date-${index}`} />
                      <Label htmlFor={`date-${index}`} className="flex-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {format(item.date, "dd.MM.yyyy")} ({format(item.date, "EEEE")})
                          <span className="block text-sm text-muted-foreground">
                            {item.timeLabel}
                          </span>
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex h-4 w-4 items-center justify-center rounded-full border border-primary"
                    onClick={() => setUseCustomDate(true)}
                  >
                    {useCustomDate && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <Label 
                    className="cursor-pointer" 
                    onClick={() => setUseCustomDate(true)}
                  >
                    Выбрать другую дату и время
                  </Label>
                </div>
                
                {useCustomDate && (
                  <div className="pl-6 pt-2">
                    <Input
                      type="datetime-local"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Дата и время занятия</Label>
              <Input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full"
              />
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (!scheduledDate && !customDate)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Назначение...
                </>
              ) : (
                request?.status === TrialRequestStatus.TRIAL_ASSIGNED
                  ? "Перенести"
                  : "Назначить"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}