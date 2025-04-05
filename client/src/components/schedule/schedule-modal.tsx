import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Дни недели
const DAYS_OF_WEEK = [
  { id: 'monday', name: 'Понедельник' },
  { id: 'tuesday', name: 'Вторник' },
  { id: 'wednesday', name: 'Среда' },
  { id: 'thursday', name: 'Четверг' },
  { id: 'friday', name: 'Пятница' },
  { id: 'saturday', name: 'Суббота' },
  { id: 'sunday', name: 'Воскресенье' },
];

interface ScheduleTime {
  startTime: string;
  endTime: string;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: string) => Promise<void>;
  title?: string;
  initialSchedule?: string;
  entityName?: string;
}

export function ScheduleModal({
  isOpen,
  onClose,
  onSave,
  title = 'Добавить расписание',
  initialSchedule = '',
  entityName = '',
}: ScheduleModalProps) {
  // Разбираем начальное расписание если оно есть
  const parseInitialSchedule = (): { [key: string]: ScheduleTime | null } => {
    const result: { [key: string]: ScheduleTime | null } = {};
    DAYS_OF_WEEK.forEach(day => {
      result[day.id] = null;
    });

    if (!initialSchedule) return result;

    const lines = initialSchedule.split('\n');
    lines.forEach(line => {
      // Формат: "Понедельник: 09:00 - 10:00"
      const match = line.match(/([^:]+):\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (match) {
        const [, dayName, startTime, endTime] = match;
        const day = DAYS_OF_WEEK.find(d => 
          d.name.toLowerCase() === dayName.trim().toLowerCase()
        );
        
        if (day) {
          result[day.id] = { startTime, endTime };
        }
      }
    });

    return result;
  };

  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    const parsed = parseInitialSchedule();
    return Object.keys(parsed).filter(day => parsed[day] !== null);
  });
  
  const [scheduleTimes, setScheduleTimes] = useState<{ [key: string]: ScheduleTime }>(() => {
    const parsed = parseInitialSchedule();
    const times: { [key: string]: ScheduleTime } = {};
    
    Object.keys(parsed).forEach(day => {
      if (parsed[day]) {
        times[day] = parsed[day] as ScheduleTime;
      }
    });
    
    return times;
  });

  // Обработчик изменения выбранных дней
  const handleDayToggle = (dayId: string) => {
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(id => id !== dayId);
      } else {
        // Если день добавляется, инициализируем время по умолчанию
        if (!scheduleTimes[dayId]) {
          setScheduleTimes(prevTimes => ({
            ...prevTimes,
            [dayId]: { startTime: '09:00', endTime: '10:00' }
          }));
        }
        return [...prev, dayId];
      }
    });
  };

  // Обработчик изменения времени
  const handleTimeChange = (dayId: string, field: 'startTime' | 'endTime', value: string) => {
    setScheduleTimes(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
    }));
  };

  // Формирование строки расписания
  const formatSchedule = (): string => {
    return selectedDays.map(dayId => {
      const day = DAYS_OF_WEEK.find(d => d.id === dayId);
      const times = scheduleTimes[dayId];
      return `${day?.name}: ${times.startTime} - ${times.endTime}`;
    }).join('\n');
  };

  // Сохранение расписания
  const handleSave = async () => {
    try {
      const formattedSchedule = formatSchedule();
      await onSave(formattedSchedule);
      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении расписания:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить расписание',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        {entityName && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">{entityName}</p>
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <Label className="mb-2 block">Выберите дни недели</Label>
            <div className="grid grid-cols-2 gap-3">
              {DAYS_OF_WEEK.map(day => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`day-${day.id}`} 
                    checked={selectedDays.includes(day.id)}
                    onCheckedChange={() => handleDayToggle(day.id)}
                  />
                  <Label htmlFor={`day-${day.id}`}>{day.name}</Label>
                </div>
              ))}
            </div>
          </div>
          
          {selectedDays.length > 0 && (
            <div className="space-y-4">
              <Label>Время занятий</Label>
              {selectedDays.map(dayId => {
                const day = DAYS_OF_WEEK.find(d => d.id === dayId);
                const times = scheduleTimes[dayId] || { startTime: '09:00', endTime: '10:00' };
                
                return (
                  <div key={dayId} className="grid grid-cols-2 gap-4 items-center pt-2 border-t">
                    <Label>{day?.name}</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="time" 
                        value={times.startTime}
                        onChange={(e) => handleTimeChange(dayId, 'startTime', e.target.value)}
                        className="w-24"
                      />
                      <span>-</span>
                      <Input 
                        type="time" 
                        value={times.endTime}
                        onChange={(e) => handleTimeChange(dayId, 'endTime', e.target.value)}
                        className="w-24"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={selectedDays.length === 0}>
            Сохранить расписание
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}