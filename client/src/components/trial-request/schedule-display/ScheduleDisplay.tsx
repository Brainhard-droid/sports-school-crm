import React from 'react';
import { Schedule, scheduleService } from '@/services/ScheduleService';

export interface ScheduleDisplayProps {
  scheduleData: Schedule | null;
}

/**
 * Компонент для отображения расписания
 * Следует Interface Segregation Principle - компонент принимает только те данные,
 * которые ему необходимы для работы
 */
export const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ scheduleData }) => {
  if (!scheduleData) return null;

  return (
    <div className="space-y-2 border rounded-md p-4 bg-muted/50">
      <h4 className="text-sm font-medium">Расписание занятий:</h4>
      <div className="text-sm text-muted-foreground space-y-1">
        {Object.entries(scheduleData).map(([day, times]) => (
          <div key={day} className="flex justify-between">
            <span>{day}:</span>
            <span>{Array.isArray(times) ? times.join(", ") : String(times)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};