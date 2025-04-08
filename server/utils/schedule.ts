import { Schedule } from '@shared/schema';
import { addDays, setDate, getDaysInMonth, startOfMonth, format, parseISO, setHours, setMinutes } from 'date-fns';

/**
 * Генерирует массив дат занятий для группы на основе расписания
 * @param groupSchedules Массив записей расписания группы
 * @param month Месяц (0-11)
 * @param year Год
 * @returns Массив дат занятий
 */
export function generateScheduleDates(
  groupSchedules: Schedule[],
  month: number,
  year: number
): Date[] {
  // Коррекция месяца, так как в JS месяцы начинаются с 0
  const jsMonth = month - 1;
  
  // Получаем первый день месяца
  const startDate = startOfMonth(new Date(year, jsMonth));
  
  // Количество дней в месяце
  const daysInMonth = getDaysInMonth(startDate);
  
  // Массив для хранения дат занятий
  const dates: Date[] = [];
  
  // Обходим все дни месяца
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = setDate(startDate, day);
    const dayOfWeek = currentDate.getDay(); // 0 - воскресенье, 1 - понедельник, и т.д.
    
    // Находим расписания для текущего дня недели
    const daySchedules = groupSchedules.filter(
      schedule => schedule.dayOfWeek === dayOfWeek
    );
    
    // Если есть расписание на этот день недели, добавляем дату
    for (const schedule of daySchedules) {
      const [hours, minutes] = schedule.startTime.split(':').map(Number);
      const lessonDate = new Date(currentDate);
      lessonDate.setHours(hours, minutes, 0, 0);
      
      dates.push(lessonDate);
    }
  }
  
  // Сортируем даты по возрастанию
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Нормализует текстовое расписание в объект с днями недели и временем
 * @param scheduleText Текстовое представление расписания
 * @returns Объект с расписанием по дням недели
 */
export function normalizeSchedule(
  scheduleText: string
): Record<string, string | string[]> {
  // Пример структуры расписания: "Понедельник: 10:00-11:30, Среда: 15:00-16:30, Пятница: 17:00-18:30"
  const schedule: Record<string, string | string[]> = {};
  
  // Регулярное выражение для извлечения дня недели и времени
  const regex = /([а-яА-Я]+):\s*([0-9]{1,2}:[0-9]{2}(?:-[0-9]{1,2}:[0-9]{2})?)/g;
  
  let match;
  while ((match = regex.exec(scheduleText)) !== null) {
    const day = match[1]; // День недели (например, "Понедельник")
    const time = match[2]; // Время (например, "10:00-11:30")
    
    if (schedule[day]) {
      // Если день уже есть в расписании, добавляем новое время как элемент массива
      if (Array.isArray(schedule[day])) {
        (schedule[day] as string[]).push(time);
      } else {
        schedule[day] = [schedule[day] as string, time];
      }
    } else {
      schedule[day] = time;
    }
  }
  
  return schedule;
}

/**
 * Преобразует объекты расписания Drizzle в дружественный формат для работы
 * @param schedules Массив записей расписания из базы данных
 * @returns Объект с расписанием по дням недели
 */
export function scheduleObjectToText(schedules: Schedule[]): string {
  // Массив для всех строк расписания
  const scheduleStrings: string[] = [];
  
  // Мапинг дней недели для дружественного представления
  const daysOfWeek = [
    'Воскресенье',
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота'
  ];
  
  // Группируем расписания по дням недели
  const schedulesByDay: Record<number, Schedule[]> = {};
  
  schedules.forEach(schedule => {
    if (!schedulesByDay[schedule.dayOfWeek]) {
      schedulesByDay[schedule.dayOfWeek] = [];
    }
    schedulesByDay[schedule.dayOfWeek].push(schedule);
  });
  
  // Формируем строки расписания
  for (const [dayOfWeekStr, daySchedules] of Object.entries(schedulesByDay)) {
    const dayOfWeek = parseInt(dayOfWeekStr);
    const dayName = daysOfWeek[dayOfWeek];
    
    // Сортируем расписания по времени начала
    daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // Формируем строки времени для каждого расписания
    const timeStrings = daySchedules.map(
      schedule => `${schedule.startTime}-${schedule.endTime}`
    );
    
    // Добавляем строку расписания для дня недели
    scheduleStrings.push(`${dayName}: ${timeStrings.join(', ')}`);
  }
  
  return scheduleStrings.join('; ');
}