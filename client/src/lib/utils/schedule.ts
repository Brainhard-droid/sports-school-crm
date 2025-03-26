import { addDays, parse, isBefore, format } from "date-fns";

interface DaySchedule {
  time: string; // формат "15:00 - 17:00"
}

interface WeekSchedule {
  [key: string]: DaySchedule | null; // monday, tuesday, etc.
}

export function getNextLessonDates(schedule: WeekSchedule, count: number = 5): string[] {
  const today = new Date();
  const dates: string[] = [];
  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let currentDate = today;
  
  while (dates.length < count) {
    const dayOfWeek = weekDays[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1];
    const daySchedule = schedule[dayOfWeek];
    
    if (daySchedule) {
      const [startTime] = daySchedule.time.split(' - ');
      const lessonDate = new Date(currentDate);
      const [hours, minutes] = startTime.split(':');
      
      lessonDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      if (isBefore(today, lessonDate)) {
        dates.push(format(lessonDate, "yyyy-MM-dd'T'HH:mm"));
      }
    }
    
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
}

export function parseScheduleFromText(scheduleText: string): WeekSchedule {
  const schedule: WeekSchedule = {};
  const lines = scheduleText.split('\n');
  
  lines.forEach(line => {
    const [day, time] = line.split(':').map(s => s.trim());
    if (day && time) {
      const normalizedDay = day.toLowerCase();
      schedule[normalizedDay] = { time };
    }
  });
  
  return schedule;
}
