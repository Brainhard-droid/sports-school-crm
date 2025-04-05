import { format, addDays, isAfter, parseISO, isValid } from "date-fns";
import { ru } from "date-fns/locale";

// Типы данных расписания
export type TimeRange = {
  start: string; // "HH:MM" формат
  end: string; // "HH:MM" формат
};

export type WeekDaySchedule = {
  [key: string]: TimeRange[];
};

// Дни недели на русском для сопоставления с названиями в расписании
const DAYS_OF_WEEK = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

// Эта функция получает ближайшие N дат занятий на основе расписания
export function getNextLessonDates(schedule: WeekDaySchedule, count: number = 5): { date: Date, timeLabel: string }[] {
  const result: { date: Date, timeLabel: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Максимальное количество дней для поиска (3 недели вперед)
  const MAX_DAYS = 21;
  
  // Проходим по следующим дням и находим подходящие даты
  for (let dayOffset = 0; result.length < count && dayOffset < MAX_DAYS; dayOffset++) {
    const currentDate = addDays(today, dayOffset);
    const dayOfWeek = DAYS_OF_WEEK[currentDate.getDay()].toLowerCase();
    
    // Проверяем все дни недели в расписании
    Object.entries(schedule).forEach(([scheduleDay, timeRanges]) => {
      // Если текущий день недели есть в расписании
      if (scheduleDay.toLowerCase().includes(dayOfWeek) && timeRanges && timeRanges.length > 0) {
        timeRanges.forEach(timeRange => {
          const [hours, minutes] = timeRange.start.split(":").map(Number);
          const [endHours, endMinutes] = timeRange.end.split(":").map(Number);
          
          const lessonDate = new Date(currentDate);
          lessonDate.setHours(hours, minutes, 0, 0);
          
          // Только будущие даты
          if (isAfter(lessonDate, new Date())) {
            const timeLabel = `${timeRange.start} - ${timeRange.end}`;
            result.push({
              date: lessonDate,
              timeLabel
            });
          }
        });
      }
    });
  }
  
  // Сортируем по дате (от ближайшей к дальней)
  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Ограничиваем количество результатов
  return result.slice(0, count);
}

// Форматирует дату и время в читаемый формат
export function formatDateTime(date: Date): string {
  if (!date || !isValid(date)) return "";
  
  return format(date, "d MMMM yyyy 'в' HH:mm", { locale: ru });
}

// Преобразует строку расписания в объект
export function parseScheduleString(scheduleText: string): WeekDaySchedule {
  if (!scheduleText) return {};
  
  const result: WeekDaySchedule = {};
  const lines = scheduleText.split("\n");
  
  lines.forEach(line => {
    line = line.trim();
    if (!line) return;
    
    // Примеры форматов строк расписания:
    // "Понедельник: 16:00 - 18:00"
    // "Понедельник: 16:00-18:00"
    const match = line.match(/^([^:]+):\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
    
    if (match) {
      const [, day, startHour, startMin, endHour, endMin] = match;
      const dayName = day.trim();
      
      if (!result[dayName]) {
        result[dayName] = [];
      }
      
      const start = `${startHour.padStart(2, '0')}:${startMin}`;
      const end = `${endHour.padStart(2, '0')}:${endMin}`;
      
      result[dayName].push({
        start,
        end
      });
    }
  });
  
  return result;
}

// Преобразует объект расписания обратно в строку
export function scheduleToString(schedule: WeekDaySchedule): string {
  return Object.entries(schedule)
    .map(([day, timeRanges]) => {
      return timeRanges.map(timeRange => 
        `${day}: ${timeRange.start} - ${timeRange.end}`
      ).join("\n");
    })
    .filter(line => line)
    .join("\n");
}