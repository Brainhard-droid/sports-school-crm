import { Schedule } from "@shared/schema";

/**
 * Генерирует даты занятий для данной группы в указанном месяце и году
 * на основе расписания группы (daysOfWeek + times)
 *
 * @param schedules Массив записей расписания
 * @param month Месяц (1-12)
 * @param year Год
 * @returns Массив дат занятий в этом месяце
 */
export function generateScheduleDates(
  schedules: Schedule[],
  month: number,
  year: number
): Date[] {
  // Проверка входных параметров
  if (!schedules?.length) {
    console.log('No schedules provided for date generation');
    return [];
  }
  
  if (month < 1 || month > 12) {
    console.error('Invalid month:', month);
    return [];
  }

  console.log('Generating dates for:', { schedules, month, year });

  // Список дат занятий
  const dates: Date[] = [];
  
  // Первый день месяца
  const startDate = new Date(year, month - 1, 1);
  
  // Последний день месяца (устанавливаем 0 день следующего месяца)
  const endDate = new Date(year, month, 0);
  
  console.log('Date range:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
  
  // Для каждого дня в месяце
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0 - воскресенье, 1 - понедельник, ...
    
    // Ищем расписание для текущего дня недели
    const matchingSchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);
    
    // Если есть расписание на этот день недели, добавляем дату в список
    if (matchingSchedules.length > 0) {
      // Добавляем копию даты в список для каждого времени занятия в этот день
      for (const schedule of matchingSchedules) {
        // Разбиваем время на часы и минуты и создаем дату
        const [hours, minutes] = schedule.startTime.split(':').map(Number);
        const lessonDate = new Date(currentDate);
        lessonDate.setHours(hours, minutes, 0, 0);
        
        dates.push(lessonDate);
      }
    }
    
    // Переходим к следующему дню
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Сортируем даты по возрастанию
  return dates.sort((a, b) => a.getTime() - b.getTime());
}