import { Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ScheduleDisplayProps {
  schedule: string;
  onClick: () => void;
  compact?: boolean;
}

export function ScheduleDisplay({ schedule, onClick, compact = false }: ScheduleDisplayProps) {
  if (!schedule) {
    return (
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onClick}
        className="text-xs flex items-center"
      >
        <Calendar className="h-3 w-3 mr-1" />
        Добавить расписание
      </Button>
    );
  }

  // Разбираем строку расписания на дни недели
  const scheduleLines = schedule.split('\n');
  const days = scheduleLines.map(line => {
    const [day, time] = line.split(':').map(s => s.trim());
    return { day, time };
  });

  if (compact) {
    // Компактное отображение для таблицы
    return (
      <div className="flex flex-col items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs p-1 h-auto">
                <Calendar className="h-3 w-3 mr-1" />
                <span className="whitespace-nowrap">{days.length} {getDayWord(days.length)}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1 text-xs">
                <p className="font-medium">Расписание:</p>
                {days.map(({ day, time }, index) => (
                  <p key={index}>{day}: {time}</p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClick}
          className="text-xs flex items-center p-1 h-6"
        >
          Изменить
        </Button>
      </div>
    );
  }

  // Полное отображение
  return (
    <div className="flex flex-col items-start space-y-2 w-full">
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-medium flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Расписание
        </span>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClick}
          className="text-xs"
        >
          Изменить
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-1 w-full">
        {days.map(({ day, time }, index) => (
          <Badge key={index} variant="outline" className="justify-between text-xs px-2 py-1">
            <span className="font-medium">{day}:</span> 
            <span>{time}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Функция для правильного склонения слова "день"
function getDayWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'дней';
  }
  
  if (lastDigit === 1) {
    return 'день';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня';
  }
  
  return 'дней';
}