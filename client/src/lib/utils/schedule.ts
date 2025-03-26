import { addDays, parse, isBefore, format } from "date-fns";

interface DaySchedule {
  time: string; // формат "15:00 - 17:00"
}

interface WeekSchedule {
  [key: string]: DaySchedule | null; // monday, tuesday, etc.
}

function getDayNumber(day: string): number {
  const days = {
    'Понедельник': 1,
    'Вторник': 2,
    'Среда': 3,
    'Четверг': 4,
    'Пятница': 5,
    'Суббота': 6,
    'Воскресенье': 0
  };
  return days[day as keyof typeof days] || 0;
}

export function getNextLessonDates(schedule: Record<string, string>, count: number): string[] {
  const dates: Date[] = [];
  const today = new Date();

  // Convert schedule to day numbers and times
  const scheduleDays = Object.entries(schedule).map(([day, time]) => ({
    dayNum: getDayNumber(day),
    time: String(time).split(',')[0] // Use first time from range
  }));

  let currentDate = new Date(today);
  while (dates.length < count) {
    const dayOfWeek = currentDate.getDay();
    const scheduleDay = scheduleDays.find(s => s.dayNum === dayOfWeek);

    if (scheduleDay) {
      const [hours, minutes] = scheduleDay.time.split(':').map(Number);
      const lessonDate = new Date(currentDate);
      lessonDate.setHours(hours, minutes, 0, 0);

      if (lessonDate > today) {
        dates.push(lessonDate);
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates.map(date => date.toISOString().split('T')[0]);
}

export function parseScheduleFromText(text: string): Record<string, string> {
  console.log('Parsing schedule text:', text);
  const schedule: Record<string, string> = {};
  const lines = text.split('\n');

  lines.forEach(line => {
    const [day, time] = line.split(':').map(s => s.trim());
    if (day && time) {
      schedule[day.toLowerCase()] = time;
    }
  });

  console.log('Parsed schedule:', schedule);
  return schedule;
}