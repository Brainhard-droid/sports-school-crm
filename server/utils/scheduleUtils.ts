/**
 * Типы расписаний - различные форматы, которые могут быть сохранены в БД
 */
export type ScheduleFormat = 
  | string 
  | { [key: string]: string[] } 
  | { text: string, structured?: { [key: string]: string[] } };

/**
 * Структурированное расписание по дням недели
 */
export type StructuredSchedule = {
  [key: string]: string[];
};

/**
 * Дни недели для использования в расписании
 */
export const WEEKDAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

/**
 * Дни недели на русском языке
 */
export const WEEKDAYS_RU = [
  'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'
];

/**
 * Регулярное выражение для поиска времени в формате ЧЧ:ММ
 */
const TIME_PATTERN = /\b([01]?[0-9]|2[0-3]):[0-5][0-9]\b/g;

/**
 * Нормализует расписание в структурированную форму
 * 
 * @param schedule Расписание в любом формате
 * @returns Структурированное расписание
 */
export function normalizeSchedule(schedule: ScheduleFormat): StructuredSchedule {
  if (!schedule) return {};

  // Если расписание уже структурировано
  if (typeof schedule === 'object' && !('text' in schedule)) {
    return schedule as StructuredSchedule;
  }

  // Если расписание с текстом и структурированными данными
  if (typeof schedule === 'object' && 'text' in schedule && schedule.structured) {
    return schedule.structured;
  }

  // Если расписание в текстовом формате, парсим его
  const scheduleText = typeof schedule === 'string' 
    ? schedule 
    : (schedule as { text: string }).text || '';

  return parseTextSchedule(scheduleText);
}

/**
 * Парсит текстовое расписание в структурированную форму
 * 
 * @param text Текстовое расписание
 * @returns Структурированное расписание
 */
export function parseTextSchedule(text: string): StructuredSchedule {
  const schedule: StructuredSchedule = {};
  
  // Если расписание пустое, возвращаем пустой объект
  if (!text.trim()) return schedule;

  // Определяем язык расписания для правильного распознавания дней недели
  const isRussian = WEEKDAYS_RU.some(day => text.toLowerCase().includes(day));
  const daysMap = isRussian 
    ? WEEKDAYS_RU.reduce((map, day, index) => ({ ...map, [day]: WEEKDAYS[index] }), {})
    : WEEKDAYS.reduce((map, day) => ({ ...map, [day]: day }), {});

  // Разбиваем текст на строки
  const lines = text.split(/\\n|\\r|\\r\\n|\n|\r/);
  
  let currentDay: string | null = null;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Поиск дня недели в строке
    for (const [dayRu, dayEn] of Object.entries(daysMap)) {
      if (lowerLine.includes(dayRu)) {
        currentDay = dayEn;
        if (!schedule[currentDay]) {
          schedule[currentDay] = [];
        }
        break;
      }
    }
    
    // Поиск времени в строке
    if (currentDay && TIME_PATTERN.test(line)) {
      const times = line.match(TIME_PATTERN);
      if (times) {
        schedule[currentDay].push(...times);
      }
    }
  }
  
  return schedule;
}

/**
 * Получает следующее время занятия из расписания
 * 
 * @param schedule Структурированное расписание
 * @param count Количество дат, которые нужно получить
 * @param startDate Дата, с которой начинать поиск
 * @returns Массив дат следующих занятий
 */
export function getNextLessonDates(
  schedule: StructuredSchedule,
  count: number = 5,
  startDate: Date = new Date()
): Date[] {
  const dates: Date[] = [];
  
  // Если расписание пустое, возвращаем пустой массив
  if (Object.keys(schedule).length === 0) return dates;
  
  // Обеспечим, что работаем с копией даты
  const currentDate = new Date(startDate);
  
  // Устанавливаем текущее время, если дата сегодняшняя
  if (currentDate.toDateString() === new Date().toDateString()) {
    currentDate.setHours(new Date().getHours());
    currentDate.setMinutes(new Date().getMinutes());
  } else {
    // Сбрасываем время на начало дня для других дат
    currentDate.setHours(0, 0, 0, 0);
  }
  
  const weekdayMap: { [key: number]: string } = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
  };
  
  let daysSearched = 0;
  const MAX_DAYS = 60; // Ограничим поиск 60 днями вперед
  
  while (dates.length < count && daysSearched < MAX_DAYS) {
    const dayOfWeek = currentDate.getDay();
    const dayKey = weekdayMap[dayOfWeek];
    
    // Проверяем, есть ли занятия в этот день недели
    if (schedule[dayKey] && schedule[dayKey].length > 0) {
      for (const timeStr of schedule[dayKey]) {
        // Парсим время занятия
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        const lessonDate = new Date(currentDate);
        lessonDate.setHours(hours, minutes, 0, 0);
        
        // Добавляем дату, только если она в будущем
        if (lessonDate > startDate && dates.length < count) {
          dates.push(lessonDate);
        }
      }
      
      // Сортируем даты для текущего дня
      dates.sort((a, b) => a.getTime() - b.getTime());
      
      // Если набрали достаточно дат, прерываем цикл
      if (dates.length >= count) break;
    }
    
    // Переходим к следующему дню
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0); // Сбрасываем время на начало дня
    daysSearched++;
  }
  
  // Возвращаем только нужное количество дат
  return dates.slice(0, count);
}

/**
 * Преобразует структурированное расписание в читаемый текст
 * 
 * @param schedule Структурированное расписание
 * @param language Язык для вывода дней недели ('ru' или 'en')
 * @returns Форматированный текст расписания
 */
export function formatSchedule(schedule: StructuredSchedule, language: 'ru' | 'en' = 'ru'): string {
  if (Object.keys(schedule).length === 0) {
    return language === 'ru' ? 'Расписание не задано' : 'Schedule not set';
  }
  
  const dayNames = language === 'ru' 
    ? ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
  const dayIndices: { [key: string]: number } = {
    'monday': 0,
    'tuesday': 1,
    'wednesday': 2,
    'thursday': 3,
    'friday': 4,
    'saturday': 5,
    'sunday': 6
  };
  
  // Сортируем дни недели в правильном порядке
  const sortedDays = Object.keys(schedule)
    .filter(day => dayIndices[day] !== undefined)
    .sort((a, b) => dayIndices[a] - dayIndices[b]);
  
  let result = '';
  
  for (const day of sortedDays) {
    if (schedule[day] && schedule[day].length > 0) {
      const dayIndex = dayIndices[day];
      const dayName = dayNames[dayIndex];
      const times = schedule[day].sort(); // Сортируем времена
      
      result += `${dayName}: ${times.join(', ')}\n`;
    }
  }
  
  return result.trim();
}