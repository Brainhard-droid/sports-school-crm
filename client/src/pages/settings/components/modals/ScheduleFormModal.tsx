import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const DAYS_OF_WEEK = [
  { id: "monday", label: "Понедельник" },
  { id: "tuesday", label: "Вторник" },
  { id: "wednesday", label: "Среда" },
  { id: "thursday", label: "Четверг" },
  { id: "friday", label: "Пятница" },
  { id: "saturday", label: "Суббота" },
  { id: "sunday", label: "Воскресенье" }
];

interface ScheduleItem {
  day: string;
  start: string;
  end: string;
}

interface ScheduleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchName: string;
  sectionName: string;
  branchId: number;
  sectionId: number;
  existingSchedule?: string;
  existingId?: number;
  onSuccess: () => void;
}

export function ScheduleFormModal({
  open,
  onOpenChange,
  branchName,
  sectionName,
  branchId,
  sectionId,
  existingSchedule,
  existingId,
  onSuccess
}: ScheduleFormModalProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Parse the existing schedule when component mounts or if existingSchedule changes
  useEffect(() => {
    if (existingSchedule) {
      try {
        // Try to parse the schedule string into structured data
        // Expect format: {"day1":["start1","end1"],"day2":["start2","end2"]}
        const parsed = JSON.parse(existingSchedule);
        const days: string[] = [];
        const items: ScheduleItem[] = [];

        // Transform the parsed data into our internal format
        Object.entries(parsed).forEach(([day, times]) => {
          if (Array.isArray(times) && times.length === 2) {
            days.push(day);
            items.push({
              day,
              start: times[0],
              end: times[1]
            });
          }
        });

        setSelectedDays(days);
        setScheduleItems(items);
      } catch (error) {
        console.error("Ошибка при разборе расписания:", error);
        
        // If we can't parse the JSON, assume it's in the old format or invalid
        setSelectedDays([]);
        setScheduleItems([]);
        
        toast({
          title: "Внимание",
          description: "Формат расписания не распознан. Настройте расписание заново.",
          variant: "default"
        });
      }
    } else {
      // No existing schedule, reset state
      setSelectedDays([]);
      setScheduleItems([]);
    }
  }, [existingSchedule]);

  // When a day is selected or deselected
  const handleDayChange = (day: string, checked: boolean) => {
    if (checked) {
      // Add day to selected days
      setSelectedDays(prev => [...prev, day]);
      
      // Add new schedule item for this day with default times
      setScheduleItems(prev => [
        ...prev,
        { day, start: "09:00", end: "10:00" }
      ]);
    } else {
      // Remove day from selected days
      setSelectedDays(prev => prev.filter(d => d !== day));
      
      // Remove schedule item for this day
      setScheduleItems(prev => prev.filter(item => item.day !== day));
    }
  };

  // Update time for a specific day
  const updateTime = (day: string, field: 'start' | 'end', value: string) => {
    setScheduleItems(prev => 
      prev.map(item => 
        item.day === day 
          ? { ...item, [field]: value } 
          : item
      )
    );
  };

  // Save the schedule
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Transform our schedule items into the format needed for the API
      const scheduleObject: Record<string, [string, string]> = {};
      scheduleItems.forEach(item => {
        scheduleObject[item.day] = [item.start, item.end];
      });
      
      // Convert to JSON string
      const scheduleJson = JSON.stringify(scheduleObject);
      
      if (existingId) {
        // Update existing schedule
        await apiRequest("PATCH", `/api/branch-sections/${existingId}`, {
          schedule: scheduleJson
        });
        
        toast({
          title: "Расписание обновлено",
          description: "Расписание секции в филиале обновлено успешно"
        });
      } else {
        // Create new schedule
        await apiRequest("POST", "/api/branch-sections", {
          branchId,
          sectionId,
          schedule: scheduleJson,
          active: true
        });
        
        toast({
          title: "Связь создана",
          description: "Секция успешно добавлена в филиал с расписанием"
        });
      }
      
      // Close modal and notify parent
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить расписание",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {existingId 
              ? "Редактирование расписания" 
              : "Добавление секции в филиал"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="mb-4">
            <strong>Филиал:</strong> {branchName}<br />
            <strong>Секция:</strong> {sectionName}
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-2">Выберите дни недели</h3>
              <div className="grid grid-cols-2 gap-4">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`day-${day.id}`} 
                      checked={selectedDays.includes(day.id)}
                      onCheckedChange={(checked) => 
                        handleDayChange(day.id, checked === true)
                      }
                    />
                    <Label htmlFor={`day-${day.id}`}>{day.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedDays.length > 0 && (
              <div>
                <h3 className="text-md font-medium mb-2">Время занятий</h3>
                <div className="space-y-4">
                  {selectedDays.map(day => {
                    const dayLabel = DAYS_OF_WEEK.find(d => d.id === day)?.label;
                    const scheduleItem = scheduleItems.find(item => item.day === day);
                    
                    return (
                      <div key={day} className="grid grid-cols-3 gap-4 items-center">
                        <div className="font-medium">{dayLabel}</div>
                        <div className="space-y-1">
                          <Label htmlFor={`start-${day}`}>Начало</Label>
                          <Input
                            id={`start-${day}`}
                            type="time"
                            value={scheduleItem?.start || "09:00"}
                            onChange={(e) => updateTime(day, "start", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`end-${day}`}>Окончание</Label>
                          <Input
                            id={`end-${day}`}
                            type="time"
                            value={scheduleItem?.end || "10:00"}
                            onChange={(e) => updateTime(day, "end", e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || selectedDays.length === 0}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}