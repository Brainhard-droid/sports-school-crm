import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { getNextLessonDates, formatDateTime } from "@/lib/utils/schedule";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PrivacyConsent } from "@/components/ui/privacy-consent";

interface AssignTrialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: number;
  initialData: {
    parentName: string;
    parentPhone: string;
    childName: string;
    childAge: number;
    branchId: number;
    sectionId: number;
    desiredDate?: Date;
    notes?: string;
  };
}

export default function AssignTrialModal({
  open,
  onOpenChange,
  requestId,
  initialData,
}: AssignTrialModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [parentName, setParentName] = useState(initialData.parentName || "");
  const [parentPhone, setParentPhone] = useState(initialData.parentPhone || "");
  const [childName, setChildName] = useState(initialData.childName || "");
  const [childAge, setChildAge] = useState(initialData.childAge || 0);
  const [branchId, setBranchId] = useState<number | null>(initialData.branchId || null);
  const [sectionId, setSectionId] = useState<number | null>(initialData.sectionId || null);
  const [notes, setNotes] = useState(initialData.notes || "");
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialData.desiredDate || null);
  const [selectedTime, setSelectedTime] = useState<string>(""); 
  const [openCalendar, setOpenCalendar] = useState(false);
  const [suggestedDates, setSuggestedDates] = useState<{date: Date, timeLabel: string}[]>([]);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [suggestedDateSelected, setSuggestedDateSelected] = useState(false);

  // Получение филиалов
  const { data: branches } = useQuery({
    queryKey: ["/api/branches"],
    throwOnError: false,
  });

  // Получение секций
  const { data: sections } = useQuery({
    queryKey: ["/api/sections"],
    throwOnError: false,
  });

  // Получение расписания для выбранной секции и филиала
  const { data: branchSection, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ["/api/branch-sections", branchId, sectionId],
    enabled: !!branchId && !!sectionId,
    throwOnError: false,
  });

  // Генерация предложенных дат на основе расписания
  useEffect(() => {
    if (branchSection?.schedule && branchId && sectionId) {
      try {
        const parsedSchedule = JSON.parse(branchSection.schedule);
        const dates = getNextLessonDates(parsedSchedule, 5);
        setSuggestedDates(dates);
        
        // Если есть желаемая дата, пытаемся найти ближайшую из предложенных
        if (initialData.desiredDate && !suggestedDateSelected) {
          const desiredDate = new Date(initialData.desiredDate);
          const closest = dates.reduce((prev, curr) => {
            const prevDiff = Math.abs(prev.date.getTime() - desiredDate.getTime());
            const currDiff = Math.abs(curr.date.getTime() - desiredDate.getTime());
            return currDiff < prevDiff ? curr : prev;
          }, dates[0]);
          
          if (closest) {
            setSelectedDate(closest.date);
            setSelectedTime(closest.timeLabel);
            setSuggestedDateSelected(true);
          }
        }
      } catch (error) {
        console.error("Ошибка при обработке расписания:", error);
      }
    }
  }, [branchSection, branchId, sectionId, initialData.desiredDate, suggestedDateSelected]);

  // Мутация для назначения пробного занятия
  const assignTrialMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/trial-requests/${requestId}/assign`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
      toast({
        title: "Пробное занятие назначено",
        description: "Пробное занятие успешно назначено",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Ошибка при назначении пробного занятия:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось назначить пробное занятие. Попробуйте еще раз.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast({
        title: "Выберите дату",
        description: "Пожалуйста, выберите дату и время пробного занятия",
        variant: "destructive",
      });
      return;
    }
    
    if (!branchId || !sectionId) {
      toast({
        title: "Выберите филиал и секцию",
        description: "Пожалуйста, выберите филиал и секцию для пробного занятия",
        variant: "destructive",
      });
      return;
    }

    if (!privacyConsent) {
      toast({
        title: "Требуется согласие",
        description: "Пожалуйста, подтвердите согласие на обработку персональных данных",
        variant: "destructive",
      });
      return;
    }
    
    // Установка времени из выбранного времени занятия
    let scheduledDate = new Date(selectedDate);
    
    // Если выбрано время из предложенных вариантов, используем его
    if (selectedTime) {
      const timeStart = selectedTime.split(" - ")[0].trim();
      const [hours, minutes] = timeStart.split(":").map(Number);
      scheduledDate.setHours(hours, minutes, 0, 0);
    }
    
    assignTrialMutation.mutate({
      scheduledDate,
      parentName,
      parentPhone,
      childName,
      childAge: Number(childAge),
      branchId,
      sectionId,
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Назначение пробного занятия</DialogTitle>
          <DialogDescription>
            Заполните информацию для назначения пробного занятия
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Данные родителя */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentName">Имя родителя</Label>
                <Input 
                  id="parentName" 
                  value={parentName} 
                  onChange={(e) => setParentName(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Телефон родителя</Label>
                <Input 
                  id="parentPhone" 
                  value={parentPhone} 
                  onChange={(e) => setParentPhone(e.target.value)} 
                  required 
                />
              </div>
            </div>
            
            {/* Данные ребенка */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="childName">Имя ребенка</Label>
                <Input 
                  id="childName" 
                  value={childName} 
                  onChange={(e) => setChildName(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="childAge">Возраст ребенка</Label>
                <Input 
                  id="childAge" 
                  type="number" 
                  min="1" 
                  max="18" 
                  value={childAge || ""} 
                  onChange={(e) => setChildAge(Number(e.target.value))} 
                  required 
                />
              </div>
            </div>
            
            {/* Филиал и секция */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Филиал</Label>
                <Select 
                  value={branchId?.toString() || ""} 
                  onValueChange={(value) => setBranchId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите филиал" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Секция</Label>
                <Select 
                  value={sectionId?.toString() || ""} 
                  onValueChange={(value) => setSectionId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите секцию" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections?.map((section: any) => (
                      <SelectItem key={section.id} value={section.id.toString()}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Предложенные даты на основе расписания */}
            <div className="space-y-2">
              <Label>Рекомендуемые даты (на основе расписания)</Label>
              {suggestedDates.length > 0 ? (
                <RadioGroup 
                  value={selectedDate && selectedTime ? 
                    JSON.stringify({date: selectedDate.toISOString(), time: selectedTime}) : 
                    ""}
                  onValueChange={(value) => {
                    if (value) {
                      const parsed = JSON.parse(value);
                      setSelectedDate(new Date(parsed.date));
                      setSelectedTime(parsed.time);
                    }
                  }}
                  className="flex flex-col space-y-1 mt-2"
                >
                  {suggestedDates.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={JSON.stringify({date: item.date.toISOString(), time: item.timeLabel})} 
                        id={`date-${index}`} 
                      />
                      <Label htmlFor={`date-${index}`} className="font-normal">
                        {format(item.date, "dd MMMM (EEEE)", {locale: ru})}, {item.timeLabel}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : isLoadingSchedule ? (
                <p className="text-sm text-muted-foreground">Загрузка расписания...</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Нет доступного расписания для выбранного филиала и секции
                </p>
              )}
            </div>
            
            {/* Выбор произвольной даты */}
            <div className="space-y-2">
              <Label>Или выберите произвольную дату и время</Label>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1">
                  <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "dd MMMM yyyy", {locale: ru})
                        ) : (
                          "Выберите дату"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate || undefined}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setOpenCalendar(false);
                          setSelectedTime("");
                        }}
                        disabled={{ before: new Date() }}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1">
                  <Input
                    type="time"
                    value={selectedTime.split(" - ")[0] || ""}
                    onChange={(e) => {
                      setSelectedTime(`${e.target.value} - ${e.target.value}`);
                    }}
                    disabled={!selectedDate}
                  />
                </div>
              </div>
            </div>
            
            {/* Примечания */}
            <div className="space-y-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
              />
            </div>
            
            {/* Согласие на обработку персональных данных */}
            <PrivacyConsent 
              checked={privacyConsent}
              onCheckedChange={setPrivacyConsent}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={assignTrialMutation.isPending}>
              {assignTrialMutation.isPending ? "Назначение..." : "Назначить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}