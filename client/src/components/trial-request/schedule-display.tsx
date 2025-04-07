import React from 'react';

type ScheduleDisplayProps = {
  schedule: Record<string, string | string[]> | null;
};

export const ScheduleDisplay = ({ schedule }: ScheduleDisplayProps) => {
  if (!schedule) return null;

  return (
    <div className="space-y-2 border rounded-md p-4 bg-muted/50">
      <h4 className="text-sm font-medium">Расписание занятий:</h4>
      <div className="text-sm text-muted-foreground space-y-1">
        {Object.entries(schedule).map(([day, times]) => (
          <div key={day} className="flex justify-between">
            <span>{day}:</span>
            <span>{Array.isArray(times) ? times.join(" - ") : String(times)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};