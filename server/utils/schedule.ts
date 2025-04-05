/**
 * Утилиты для работы с расписанием занятий
 */

// Преобразует день недели в число (0 = Воскресенье, 1 = Понедельник, ...)
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

/**
 * Парсит расписание из текста
 * Формат: день1: время1\nдень2: время2\n...
 */
export function parseSchedule(scheduleText: string): Record<string, string> {
  console.log('Parsing schedule text:', scheduleText);
  const schedule: Record<string, string> = {};
  
  if (!scheduleText || typeof scheduleText !== 'string') {
    return schedule;
  }

  const lines = scheduleText.split('\n').filter(line => line.trim() !== '');

  lines.forEach(line => {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const day = parts[0].trim();
      const time = parts.slice(1).join(':').trim();
      if (day && time) {
        schedule[day] = time;
      }
    }
  });

  console.log('Parsed schedule:', schedule);
  return schedule;
}

/**
 * Генерирует ближайшие даты занятий на основе расписания
 * @param schedule Объект расписания вида { 'понедельник': '10:00 - 11:00', ... }
 * @param startDate Дата, от которой нужно начать генерацию
 * @param count Количество дат для генерации
 * @returns Массив объектов с датами и временем
 */
export function getNextLessonDates(
  schedule: Record<string, string>,
  startDate: Date = new Date(),
  count: number = 5
): { date: Date; time: string }[] {
  const results: { date: Date; time: string }[] = [];
  
  if (!schedule || Object.keys(schedule).length === 0) {
    return results;
  }

  // Конвертируем расписание в объекты с номером дня и временем
  const scheduleDays: { dayNum: number; timeRange: string }[] = [];
  
  Object.entries(schedule).forEach(([day, timeRange]) => {
    const dayNum = getDayNumber(day);
    if (dayNum !== undefined) {
      scheduleDays.push({
        dayNum,
        timeRange: timeRange.trim()
      });
    }
  });
  
  if (scheduleDays.length === 0) {
    return results;
  }

  // Генерируем даты на 4 недели вперед
  const daysToCheck = 28;
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < daysToCheck && results.length < count; i++) {
    const dayOfWeek = currentDate.getDay();
    
    // Ищем этот день недели в расписании
    const matchingDay = scheduleDays.find(sd => sd.dayNum === dayOfWeek);
    
    if (matchingDay) {
      // Разбираем время занятия (берём только начало для создания даты)
      let startTime = matchingDay.timeRange;
      if (matchingDay.timeRange.includes('-')) {
        startTime = matchingDay.timeRange.split('-')[0].trim();
      }
      
      // Создаем дату занятия
      const [hours, minutes] = startTime.split(':').map(Number);
      
      if (!isNaN(hours) && !isNaN(minutes)) {
        const lessonDate = new Date(currentDate);
        lessonDate.setHours(hours, minutes, 0, 0);
        
        // Проверяем, что дата в будущем
        if (lessonDate > startDate) {
          results.push({
            date: lessonDate,
            time: matchingDay.timeRange
          });
        }
      }
    }
    
    // Переходим к следующему дню
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return results;
}

/**
 * Разбор расписания из разных форматов данных
 * Работает как с JSON, так и с текстовым форматом
 */
export function parseScheduleFromAnyFormat(scheduleData: any): Record<string, string> {
  // Если расписание - строка, пытаемся разобрать как JSON или как текст
  if (typeof scheduleData === 'string') {
    try {
      // Пытаемся разобрать как JSON
      const parsed = JSON.parse(scheduleData);
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.text) {
          // Если есть поле text, разбираем его как текст
          return parseSchedule(parsed.text);
        } else {
          // Иначе возвращаем сам объект
          return parsed;
        }
      }
    } catch (e) {
      // Если не удалось разобрать как JSON, разбираем как текст
      return parseSchedule(scheduleData);
    }
  } else if (scheduleData && typeof scheduleData === 'object') {
    // Если расписание уже объект, проверяем наличие поля text
    if (scheduleData.text) {
      return parseSchedule(scheduleData.text);
    } else {
      // Копируем объект
      const result: Record<string, string> = {};
      Object.entries(scheduleData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          result[key] = value;
        } else if (Array.isArray(value)) {
          result[key] = value.join(' - ');
        } else {
          result[key] = String(value);
        }
      });
      return result;
    }
  }
  
  // Если ничего не подошло, возвращаем пустой объект
  return {};
}