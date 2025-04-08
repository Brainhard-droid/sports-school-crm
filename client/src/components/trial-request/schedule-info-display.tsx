import React from 'react';
import { Schedule } from '@/services/ScheduleService';

type ScheduleInfoDisplayProps = {
  schedule: Schedule | null;
};

/**
 * Информационный компонент для отображения расписания без возможности редактирования
 * Следует Single Responsibility Principle - отвечает только за отображение расписания
 */
export const ScheduleInfoDisplay = ({ schedule }: ScheduleInfoDisplayProps) => {
  if (!schedule) return null;

  return (
    <div className="space-y-2 border rounded-md p-4 bg-muted/50">
      <h4 className="text-sm font-medium">Расписание занятий:</h4>
      <div className="text-sm text-muted-foreground space-y-1">
        {Object.entries(schedule).map(([day, times]) => (
          <div key={day}>
            <div className="flex justify-between">
              <span className="font-medium">{day}:</span>
            </div>
            {Array.isArray(times) ? (
              <ul className="list-disc list-inside pl-2">
                {times.map((time, index) => (
                  <li key={index} className="text-sm">{time}</li>
                ))}
              </ul>
            ) : (
              <div className="pl-2">{String(times)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};