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
  
  // При открытии модального окна, заполняем дату из запроса (принцип SRP из SOLID)
  useEffect(() => {
    const extractRequestDateTime = () => {
      if (!request || !isOpen) return;
      
      console.log('Открываем окно для запроса:', request);
      
      // Сбрасываем предыдущие значения при каждом открытии
      setScheduledDate("");
      
      // Проверяем, есть ли уже назначенная дата
      if (request.scheduledDate) {
        // Если это редактирование уже назначенной даты
        console.log('Найдена назначенная дата:', request.scheduledDate);
        const scheduledDateObj = new Date(request.scheduledDate);
        
        // Форматируем дату для datetime-local input
        const year = scheduledDateObj.getFullYear();
        const month = String(scheduledDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(scheduledDateObj.getDate()).padStart(2, '0');
        const hours = String(scheduledDateObj.getHours()).padStart(2, '0');
        const minutes = String(scheduledDateObj.getMinutes()).padStart(2, '0');
        
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
        console.log('Форматированная назначенная дата:', formattedDate);
        
        setCustomDate(formattedDate);
        setUseCustomDate(true);
        return;
      }
      
      // Если нет назначенной даты, проверяем желаемую дату
      if (!request.desiredDate) {
        console.log('Желаемая дата не указана, устанавливаем текущую дату');
        const now = new Date();
        const formattedCurrentDate = now.toISOString().slice(0, 16);
        setCustomDate(formattedCurrentDate);
        setUseCustomDate(true);
        return;
      }
      
      try {
        // Получаем дату из запроса и конвертируем ее в объект
        const desiredDateObj = new Date(request.desiredDate);
        console.log('Желаемая дата из запроса:', desiredDateObj);
        
        // Извлекаем время из notes, если оно там есть (формат "TIME:16:30")
        let timeString = "09:00"; // Время по умолчанию
        if (request.notes) {
          const timeMatch = request.notes.match(/TIME:(\d{1,2}:\d{2})/);
          if (timeMatch) {
            timeString = timeMatch[1];
            console.log('Найдено время в примечаниях:', timeString);
          }
        }
        
        // Форматируем дату для datetime-local input
        const year = desiredDateObj.getFullYear();
        const month = String(desiredDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(desiredDateObj.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}T${timeString}`;
        console.log('Форматированная желаемая дата:', formattedDate);
        
        // Устанавливаем дату и помечаем, что используем пользовательский ввод
        setCustomDate(formattedDate);
        setUseCustomDate(true);
      } catch (error) {
        console.error('Ошибка при обработке желаемой даты:', error);
        // В случае ошибки, просто устанавливаем текущую дату
        const now = new Date();
        const formattedCurrentDate = now.toISOString().slice(0, 16);
        setCustomDate(formattedCurrentDate);
        setUseCustomDate(true);
      }
    };
    
    // Вызываем функцию для извлечения даты и времени
    extractRequestDateTime();
  }, [request, isOpen]);

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
    if (request) {
      // Если у заявки есть желаемая дата, сначала используем её
      if (request.desiredDate) {
        // Конвертируем desiredDate в объект Date
        const desiredDate = new Date(request.desiredDate);
        
        // Проверяем, есть ли информация о времени в notes (формат "TIME:16:30")
        const timeMatch = request.notes?.match(/TIME:(\d{1,2}:\d{2})/);
        if (timeMatch) {
          // Если есть, устанавливаем часы и минуты из notes
          const [hours, minutes] = timeMatch[1].split(':').map(Number);
          desiredDate.setHours(hours, minutes);
        }
        
        // Устанавливаем желаемую дату как выбранную по умолчанию
        setCustomDate(formatDateTime(desiredDate));
        // Если ещё не загружено расписание, показываем желаемую дату пользователя
        if (!branchSchedule) {
          setUseCustomDate(true);
        }
      }
      
      // Если есть расписание, генерируем даты занятий
      if (branchSchedule) {
        // Генерируем 5 ближайших дат занятий на основе расписания
        const nextDates = getNextLessonDates(branchSchedule, 5);
        setSuggestedDates(nextDates);
        
        // Если есть желаемая дата, проверяем, совпадает ли она с одной из дат расписания
        if (request.desiredDate && nextDates.length > 0) {
          const desiredDate = new Date(request.desiredDate);
          
          // Проверяем, есть ли информация о времени в notes
          const timeMatch = request.notes?.match(/TIME:(\d{1,2}:\d{2})/);
          if (timeMatch) {
            const [hours, minutes] = timeMatch[1].split(':').map(Number);
            desiredDate.setHours(hours, minutes);
          }
          
          // Проверяем, совпадает ли желаемая дата с одной из предложенных дат
          const matchingDateIndex = nextDates.findIndex(date => 
            date.date.getFullYear() === desiredDate.getFullYear() &&
            date.date.getMonth() === desiredDate.getMonth() &&
            date.date.getDate() === desiredDate.getDate() &&
            date.date.getHours() === desiredDate.getHours()
          );
          
          if (matchingDateIndex >= 0) {
            // Если дата совпадает с расписанием, выбираем её
            setScheduledDate(formatDateTime(nextDates[matchingDateIndex].date));
            setUseCustomDate(false);
          } else {
            // Если не совпадает, используем пользовательскую дату
            setScheduledDate("");
            setUseCustomDate(true);
          }
        } else if (nextDates.length > 0) {
          // Если нет желаемой даты, выбираем первую дату из списка
          setScheduledDate(formatDateTime(nextDates[0].date));
          setUseCustomDate(false);
        }
      }
    }
  }, [request, branchSchedule]);

  const handleSubmit = async () => {
    if (!request) return;

    // Определяем, какую дату использовать
    let finalDate: string;
    if (useCustomDate) {
      finalDate = customDate;
    } else {
      finalDate = scheduledDate;
    }
    
    if (!finalDate) {
      toast({
        title: "Выберите дату",
        description: "Пожалуйста, выберите дату и время для пробного занятия",
        variant: "destructive"
      });
      return;
    }

    console.log('Submitting with date:', finalDate);
    setIsLoading(true);
    
    try {
      // Преобразуем строку даты в объект Date, сохраняя правильное местное время
      const dateTimeParts = finalDate.split('T');
      const dateParts = dateTimeParts[0].split('-').map(Number);
      const timeParts = dateTimeParts[1].split(':').map(Number);
      
      // Создаем объект Date в локальном часовом поясе
      const scheduledDateObj = new Date(
        dateParts[0], // год
        dateParts[1] - 1, // месяц (0-11)
        dateParts[2], // день
        timeParts[0], // час
        timeParts[1]  // минута
      );
      
      console.log('Updating status with date object:', scheduledDateObj);
      
      // Вызываем мутацию для обновления статуса с новой назначенной датой
      await updateStatus({
        id: request.id,
        status: "TRIAL_ASSIGNED",
        scheduledDate: scheduledDateObj
      });

      toast({
        title: request.status === "TRIAL_ASSIGNED" ? "Пробное занятие перенесено" : "Пробное занятие назначено",
        description: "Информация успешно обновлена",
      });

      // После успешного обновления сообщаем родительскому компоненту
      if (onSuccess) {
        onSuccess();
      }
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
            {request?.status === "TRIAL_ASSIGNED"
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