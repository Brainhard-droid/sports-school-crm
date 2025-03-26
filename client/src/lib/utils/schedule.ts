import { addDays, parse, isBefore, format } from "date-fns";

interface DaySchedule {
  time: string; // формат "15:00 - 17:00"
}

interface WeekSchedule {
  [key: string]: DaySchedule | null; // monday, tuesday, etc.
}

export function getNextLessonDates(schedule: Record<string, string>, count: number) {
  console.log('Getting next lesson dates for schedule:', schedule);
  const dates: string[] = [];
  let currentDate = new Date();
  let attempts = 0;
  const maxAttempts = count * 7; // Предотвращаем бесконечный цикл

  while (dates.length < count && attempts < maxAttempts) {
    const dayName = currentDate.toLocaleString('ru-RU', { weekday: 'long' }).toLowerCase();
    const time = schedule[dayName];

    console.log('Checking date:', currentDate, 'Day:', dayName, 'Time:', time);

    if (time) {
      try {
        const [hours, minutes] = time.split(':').map(Number);
        const lessonDate = new Date(currentDate);
        lessonDate.setHours(hours, minutes, 0, 0);

        if (lessonDate > new Date()) {
          console.log('Adding lesson date:', lessonDate);
          dates.push(lessonDate.toISOString());
        }
      } catch (error) {
        console.error('Error processing time:', time, error);
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
    attempts++;
  }

  console.log('Generated dates:', dates);
  return dates;
}

export function parseScheduleFromText(scheduleText: string) {
  console.log('Parsing schedule text:', scheduleText);
  const schedule: Record<string, string> = {};
  const lines = scheduleText.split('\n');

  lines.forEach(line => {
    const [day, time] = line.split(':').map(s => s.trim());
    if (day && time) {
      schedule[day.toLowerCase()] = time;
    }
  });

  console.log('Parsed schedule:', schedule);
  return schedule;
}