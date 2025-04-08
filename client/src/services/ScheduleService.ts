/**
 * Сервис для работы с расписаниями секций
 * Следует Single Responsibility Principle - отвечает только за работу с расписаниями
 */

import { format, addDays, parseISO, setHours, setMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';

// Типы для расписания
export type ScheduleTime = string;
export type ScheduleDay = string;
export type Schedule = Record<ScheduleDay, ScheduleTime | ScheduleTime[]>;
export type SessionInfo = { date: Date; timeLabel: string };

// Маппинг для дней недели с русского на номер дня недели
const dayMapping: Record<string, number> = {
  'Понедельник': 1,
  'Вторник': 2,
  'Среда': 3,
  'Четверг': 4,
  'Пятница': 5,
  'Суббота': 6,
  'Воскресенье': 0
};

/**
 * Класс для работы с расписаниями
 */
export class ScheduleService {
  /**
   * Парсит строку расписания в объект расписания
   * @param scheduleString Строка расписания в JSON формате
   * @returns Объект расписания или null, если парсинг не удался
   */
  parseSchedule(scheduleString: string | undefined | null): Schedule | null {
    if (!scheduleString) return null;
    
    try {
      const schedule = JSON.parse(scheduleString);
      // Дополнительная проверка на валидность структуры расписания
      if (typeof schedule !== 'object' || schedule === null) {
        console.error('Parsed schedule is not an object');
        return null;
      }
      
      // Проверка наличия хотя бы одного дня в расписании
      if (Object.keys(schedule).length === 0) {
        console.error('Schedule has no days');
        return null;
      }
      
      return schedule;
    } catch (error) {
      console.error('Error parsing schedule JSON:', error);
      return null;
    }
  }

  /**
   * Форматирует дату и время в человекочитаемый формат
   * @param date Дата или строка даты
   * @returns Отформатированная строка даты и времени
   */
  formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, "d MMMM yyyy 'г.' HH:mm", { locale: ru });
  }

  /**
   * Получает следующие N занятий на основе расписания
   * @param schedule Объект расписания с днями в качестве ключей и временем в качестве значений
   * @param count Количество занятий для возврата
   * @returns Массив дат с отформатированными метками времени
   */
  getNextSessions(
    schedule: Schedule | null,
    count: number
  ): SessionInfo[] {
    if (!schedule) return [];
    
    const today = new Date();
    const result: SessionInfo[] = [];
    
    // Счетчик для дней для поиска вперед (до 14 дней, чтобы гарантировать, что мы найдем достаточно занятий)
    let daysAhead = 0;
    
    // Продолжать, пока не найдем заданное количество занятий или не просмотрим 14 дней вперед
    while (result.length < count && daysAhead < 14) {
      const targetDate = addDays(today, daysAhead);
      const dayOfWeek = targetDate.getDay(); // 0 - воскресенье, 1 - понедельник и т.д.
      
      // Найти день в расписании, соответствующий этому дню недели
      const matchingDay = Object.entries(schedule).find(([day]) => {
        return dayMapping[day] === dayOfWeek;
      });
      
      if (matchingDay) {
        const [dayName, times] = matchingDay;
        
        // Обработка времени как строки или массива
        if (typeof times === 'string') {
          result.push({
            date: new Date(targetDate),
            timeLabel: times
          });
        } else if (Array.isArray(times)) {
          // Для каждого временного интервала в этот день
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
   * Получает даты следующих N занятий на основе расписания
   * @param schedule Объект расписания с днями в качестве ключей и временем в качестве значений
   * @param count Количество занятий для возврата
   * @returns Массив дат для следующих занятий
   */
  getNextLessonDates(
    schedule: Schedule | null,
    count: number
  ): Date[] {
    const sessions = this.getNextSessions(schedule, count);
    
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
}

// Экспортируем экземпляр сервиса для использования в приложении
export const scheduleService = new ScheduleService();