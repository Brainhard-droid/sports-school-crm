import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Group, InsertSchedule } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Константы
const DAYS_OF_WEEK = [
  { id: 1, name: "Понедельник" },
  { id: 2, name: "Вторник" },
  { id: 3, name: "Среда" },
  { id: 4, name: "Четверг" },
  { id: 5, name: "Пятница" },
  { id: 6, name: "Суббота" },
  { id: 7, name: "Воскресенье" },
];

interface ScheduleDialogProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleDialog({ group, open, onOpenChange }: ScheduleDialogProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [scheduleTimes, setScheduleTimes] = useState<{ [key: number]: { startTime: string; endTime: string } }>({});
  const { toast } = useToast();

  const createScheduleMutation = useMutation({
    mutationFn: async (data: { groupId: number; schedules: InsertSchedule[] }) => {
      // Удаляем все текущие расписания для этой группы
      const deleteResponse = await apiRequest("DELETE", `/api/schedules/group/${data.groupId}`);
      
      if (!deleteResponse.ok) {
        throw new Error('Не удалось удалить старое расписание');
      }
      
      // Затем отправляем новые значения
      const promises = data.schedules.map(schedule =>
        apiRequest("POST", "/api/schedules", schedule)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      onOpenChange(false);
      setSelectedDays([]);
      setScheduleTimes({});
      toast({
        title: "Успешно",
        description: "Расписание добавлено",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDayChange = (dayId: number) => {
    setSelectedDays(prev => {
      const isSelected = prev.includes(dayId);
      if (isSelected) {
        const newTimes = { ...scheduleTimes };
        delete newTimes[dayId];
        setScheduleTimes(newTimes);
        return prev.filter(id => id !== dayId);
      } else {
        setScheduleTimes(prev => ({
          ...prev,
          [dayId]: { startTime: "09:00", endTime: "10:00" }
        }));
        return [...prev, dayId];
      }
    });
  };

  const handleTimeChange = (dayId: number, field: 'startTime' | 'endTime', value: string) => {
    setScheduleTimes(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], [field]: value }
    }));
  };

  const handleScheduleSubmit = async () => {
    if (!group) return;
    
    const schedules = selectedDays.map(dayId => ({
      groupId: group.id,
      dayOfWeek: dayId,
      startTime: scheduleTimes[dayId].startTime,
      endTime: scheduleTimes[dayId].endTime
    }));

    await createScheduleMutation.mutateAsync({ groupId: group.id, schedules });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Добавить расписание для группы {group?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium">Выберите дни недели:</h3>
            <div className="space-y-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.id}`}
                    checked={selectedDays.includes(day.id)}
                    onCheckedChange={() => handleDayChange(day.id)}
                  />
                  <label
                    htmlFor={`day-${day.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {day.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {selectedDays.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Расписание занятий:</h3>
              <div className="space-y-4">
                {selectedDays.map((dayId) => (
                  <div key={dayId} className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm" htmlFor={`start-${dayId}`}>
                        {DAYS_OF_WEEK.find(d => d.id === dayId)?.name} - начало
                      </label>
                      <Input
                        id={`start-${dayId}`}
                        type="time"
                        value={scheduleTimes[dayId]?.startTime || "09:00"}
                        onChange={(e) =>
                          handleTimeChange(dayId, "startTime", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm" htmlFor={`end-${dayId}`}>
                        Конец
                      </label>
                      <Input
                        id={`end-${dayId}`}
                        type="time"
                        value={scheduleTimes[dayId]?.endTime || "10:00"}
                        onChange={(e) =>
                          handleTimeChange(dayId, "endTime", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleScheduleSubmit} 
            className="w-full" 
            disabled={selectedDays.length === 0}
          >
            Сохранить расписание
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}