import { parseISO, isValid } from 'date-fns';
import { Schedule, scheduleService, SessionInfo } from '@/services/ScheduleService';

// Адаптеры для обратной совместимости с существующим кодом
export const getNextSessions = (schedule: Record<string, any>, count: number): SessionInfo[] => {
  return scheduleService.getNextSessions(schedule, count);
};

export const getNextLessonDates = (schedule: Record<string, any>, count: number): SessionInfo[] => {
  return scheduleService.getNextSessions(schedule, count);
};

export const formatDateTime = (date: Date | string): string => {
  return scheduleService.formatDateTime(date);
};

/**
 * Преобразует строку времени в минуты с начала дня для сортировки
 * @param timeString Строка времени в формате 'ЧЧ:ММ' или 'ЧЧ:ММ - ЧЧ:ММ'
 * @returns Количество минут с начала дня до указанного времени
 */
export const timeToMinutes = (timeString: string): number => {
  // Если это диапазон времени (например, "10:00 - 11:00"), берем начальное время
  const time = timeString.split(' - ')[0].trim();
  const [hoursStr, minutesStr] = time.split(':');
  
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  if (isNaN(hours) || isNaN(minutes)) {
    console.error(`Invalid time format: ${timeString}`);
    return 0;
  }
  
  return hours * 60 + minutes;
};

/**
 * Сортирует дни недели в правильном порядке (начиная с понедельника)
 * @param days Массив дней недели
 * @returns Отсортированный массив дней недели
 */
export const sortWeekdays = (days: string[]): string[] => {
  const weekdayOrder: Record<string, number> = {
    'Понедельник': 1,
    'Вторник': 2,
    'Среда': 3,
    'Четверг': 4,
    'Пятница': 5,
    'Суббота': 6,
    'Воскресенье': 7
  };
  
  return [...days].sort((a, b) => {
    return (weekdayOrder[a] || 999) - (weekdayOrder[b] || 999);
  });
};

/**
 * Сортирует расписание по дням недели и времени
 * @param schedule Объект расписания
 * @returns Отсортированное расписание
 */
export const sortSchedule = (schedule: Schedule): Schedule => {
  const sortedDays = sortWeekdays(Object.keys(schedule));
  const result: Schedule = {};
  
  for (const day of sortedDays) {
    const times = schedule[day];
    
    if (Array.isArray(times)) {
      // Сортируем времена по возрастанию
      result[day] = [...times].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    } else {
      result[day] = times;
    }
  }
  
  return result;
};

/**
 * Проверяет валидность строки даты
 * @param dateString Строка даты
 * @returns true, если дата валидна
 */
export const isValidDateString = (dateString: string | undefined | null): boolean => {
  if (!dateString) return false;
  
  try {
    const date = parseISO(dateString);
    return isValid(date);
  } catch (e) {
    return false;
  }
};