import { Schedule } from "@/services/ScheduleService";

/**
 * Преобразует текстовое расписание в JSON строку
 * @param textSchedule Текстовый формат расписания (строки вида "День: время")
 * @returns JSON строка расписания
 */
export function convertTextScheduleToJson(textSchedule: string): string {
  const lines = textSchedule.split('\n');
  const schedule: Schedule = {};
  
  lines.forEach(line => {
    const match = line.match(/([^:]+):\s*(.+)/);
    if (match) {
      const [_, dayName, timeInfo] = match;
      const day = dayName.trim();
      const timeStr = timeInfo.trim();
      
      if (schedule[day]) {
        if (Array.isArray(schedule[day])) {
          (schedule[day] as string[]).push(timeStr);
        } else {
          schedule[day] = [schedule[day] as string, timeStr];
        }
      } else {
        schedule[day] = timeStr;
      }
    }
  });
  
  return JSON.stringify(schedule);
}

/**
 * Преобразует JSON строку расписания в текстовый формат
 * @param jsonSchedule JSON строка расписания
 * @returns Текстовый формат расписания (строки вида "День: время")
 */
export function convertJsonScheduleToText(jsonSchedule: string): string {
  try {
    const schedule = JSON.parse(jsonSchedule) as Schedule;
    const lines: string[] = [];
    
    Object.entries(schedule).forEach(([day, times]) => {
      if (Array.isArray(times)) {
        times.forEach(time => {
          lines.push(`${day}: ${time}`);
        });
      } else {
        lines.push(`${day}: ${times}`);
      }
    });
    
    return lines.join('\n');
  } catch (error) {
    console.error('Error converting JSON schedule to text:', error);
    return '';
  }
}

/**
 * Нормализует формат расписания (всегда возвращает JSON строку)
 * @param scheduleString Строка расписания в любом формате (JSON или текстовый)
 * @returns JSON строка расписания или пустая строка при ошибке
 */
export function normalizeScheduleFormat(scheduleString: string): string {
  try {
    // Пробуем распарсить как JSON
    JSON.parse(scheduleString);
    return scheduleString; // Если удалось распарсить, это уже JSON
  } catch (error) {
    // Если не удалось распарсить как JSON, считаем, что это текстовый формат
    return convertTextScheduleToJson(scheduleString);
  }
}