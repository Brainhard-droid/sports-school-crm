import { addDays, parse, isBefore, format, getDay } from "date-fns";

interface DaySchedule {
  time: string; // формат "15:00 - 17:00"
}

interface WeekSchedule {
  [key: string]: DaySchedule | null; // monday, tuesday, etc.
}

type ScheduleFormat = {
  dayOfWeek: number; // 0 = Воскресенье, 1 = Понедельник, ...
  startTime: string; // формат "15:00"
  endTime: string; // формат "17:00"
};

function getDayNumber(day: string): number {
  const days: Record<string, number> = {
    'Понедельник': 1,
    'Вторник': 2,
    'Среда': 3,
    'Четверг': 4,
    'Пятница': 5,
    'Суббота': 6,
    'Воскресенье': 0,
    'понедельник': 1,
    'вторник': 2,
    'среда': 3,
    'четверг': 4,
    'пятница': 5,
    'суббота': 6,
    'воскресенье': 0,
  };
  return days[day] || 0;
}

export function getNextLessonDates(schedule: Record<string, string | string[]>, count: number = 5): { date: Date, timeLabel: string }[] {
  const results: { date: Date, timeLabel: string }[] = [];
  const today = new Date();
  
  console.log("Получение дат на основе расписания:", schedule);

  // Создаем массив объектов расписания
  const scheduleDays: { dayNum: number, startTime: string, endTime: string }[] = [];
  
  Object.entries(schedule).forEach(([day, timeRange]) => {
    const dayNum = getDayNumber(day);
    console.log(`День: ${day}, номер дня: ${dayNum}, диапазон времени:`, timeRange);
    
    if (dayNum === undefined) return;
    
    // Обрабатываем разные форматы timeRange
    let times: string[] = [];
    if (typeof timeRange === 'string') {
      // Проверяем формат "09:00 - 10:00" или просто время
      if (timeRange.includes(' - ')) {
        times = timeRange.split(' - ');
      } else {
        // Возможно, что это просто время, например "09:00", тогда предполагаем +1 час для конца
        const startTime = timeRange.trim();
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHours = hours + 1;
        const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        times = [startTime, endTime];
      }
    } else if (Array.isArray(timeRange) && timeRange.length >= 2) {
      times = [timeRange[0], timeRange[1]];
    }
    
    console.log("Разбор времени:", times);
    
    if (times.length === 2) {
      scheduleDays.push({
        dayNum,
        startTime: times[0].trim(),
        endTime: times[1].trim()
      });
    }
  });
  
  console.log("Дни расписания после обработки:", scheduleDays);

  // Сортируем дни по дням недели
  scheduleDays.sort((a, b) => {
    const todayNum = today.getDay();
    // Вычисляем дни от сегодня (с учетом перехода на следующую неделю)
    const daysFromTodayA = (a.dayNum - todayNum + 7) % 7;
    const daysFromTodayB = (b.dayNum - todayNum + 7) % 7;
    return daysFromTodayA - daysFromTodayB;
  });

  // Генерируем даты на ближайшие несколько недель
  const daysToCheck = 21; // Проверяем на 3 недели вперед
  let currentDate = new Date(today);
  
  for (let i = 0; i < daysToCheck && results.length < count; i++) {
    const dayOfWeek = currentDate.getDay();
    const matchingScheduleDay = scheduleDays.find(sd => sd.dayNum === dayOfWeek);
    
    if (matchingScheduleDay) {
      const [startHours, startMinutes] = matchingScheduleDay.startTime.split(':').map(Number);
      const dateObj = new Date(currentDate);
      dateObj.setHours(startHours, startMinutes, 0, 0);
      
      // Проверяем, что дата в будущем
      if (dateObj > today) {
        results.push({
          date: dateObj,
          timeLabel: `${matchingScheduleDay.startTime} - ${matchingScheduleDay.endTime}`
        });
      }
    }
    
    // Переходим к следующему дню
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log("Сформированные даты:", results);
  return results.slice(0, count);
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

/**
 * Преобразует объект Date в строку формата "yyyy-MM-ddTHH:mm" для input type="datetime-local"
 * Сохраняет локальное время, а не UTC
 */
export function formatDateTime(date: Date): string {
  // Получаем год, месяц, день, часы и минуты в локальном часовом поясе
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // Формируем строку в формате "yyyy-MM-ddTHH:mm"
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}