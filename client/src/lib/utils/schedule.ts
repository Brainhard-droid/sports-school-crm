import { format, addDays, parseISO, setHours, setMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';

// Mapping for days of week from Russian to English
const dayMapping: Record<string, number> = {
  'Понедельник': 1,
  'Вторник': 2,
  'Среда': 3,
  'Четверг': 4,
  'Пятница': 5,
  'Суббота': 6,
  'Воскресенье': 0
};

// Format date and time in a human-readable format
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "d MMMM yyyy 'г.' HH:mm", { locale: ru });
}

/**
 * Gets the next N sessions based on a schedule
 * @param schedule Schedule object with days as keys and times as values
 * @param count Number of sessions to return
 * @returns Array of dates with formatted time labels
 */
export function getNextSessions(
  schedule: Record<string, string | string[]>,
  count: number
): { date: Date; timeLabel: string }[] {
  const today = new Date();
  const result: { date: Date; timeLabel: string }[] = [];
  
  // Counter for days to look ahead (up to 14 days to ensure we find enough sessions)
  let daysAhead = 0;
  
  // Continue until we have the requested number of sessions or searched 14 days ahead
  while (result.length < count && daysAhead < 14) {
    const targetDate = addDays(today, daysAhead);
    const dayOfWeek = targetDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
    
    // Find the day in the schedule that matches this day of week
    const matchingDay = Object.entries(schedule).find(([day]) => {
      return dayMapping[day] === dayOfWeek;
    });
    
    if (matchingDay) {
      const [dayName, times] = matchingDay;
      
      // Handle times as string or array
      if (typeof times === 'string') {
        result.push({
          date: new Date(targetDate),
          timeLabel: times
        });
      } else if (Array.isArray(times)) {
        // For each time slot on this day
        times.forEach(time => {
          if (result.length < count) {
            result.push({
              date: new Date(targetDate),
              timeLabel: time
            });
          }
        });
      }
    }
    
    daysAhead++;
  }
  
  return result.slice(0, count);
}

/**
 * Gets the next N lesson dates based on a schedule
 * @param schedule Schedule object with days as keys and times as values
 * @param count Number of sessions to return
 * @returns Array of dates for the next lessons
 */
export function getNextLessonDates(
  schedule: Record<string, string | string[]>,
  count: number
): Date[] {
  const sessions = getNextSessions(schedule, count);
  
  return sessions.map(session => {
    const date = new Date(session.date);
    const timeMatch = session.timeLabel.match(/(\d{1,2}):(\d{2})/);
    
    if (timeMatch) {
      const [_, hours, minutes] = timeMatch;
      return setMinutes(setHours(date, parseInt(hours, 10)), parseInt(minutes, 10));
    }
    
    return date;
  });
}