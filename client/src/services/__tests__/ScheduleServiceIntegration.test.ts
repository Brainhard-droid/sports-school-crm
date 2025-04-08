import { ScheduleService, Schedule, SessionInfo } from '../ScheduleService';
import { format, parseISO, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

describe('ScheduleService Integration Tests', () => {
  const service = new ScheduleService();
  
  // Создаем мок даты, чтобы тесты были предсказуемыми
  const originalDate = global.Date;
  const mockDate = new Date(2023, 0, 15); // Sunday, Jan 15, 2023
  
  beforeAll(() => {
    // @ts-ignore
    global.Date = class extends originalDate {
      constructor() {
        super();
        return mockDate;
      }
      
      static now() {
        return mockDate.getTime();
      }
    };
  });
  
  afterAll(() => {
    global.Date = originalDate;
  });

  describe('parseSchedule and getNextSessions integration', () => {
    test('should parse JSON schedule and get next sessions correctly', () => {
      const jsonSchedule = '{"Понедельник":"10:00 - 11:00","Среда":"15:00 - 16:00"}';
      const parsedSchedule = service.parseSchedule(jsonSchedule);
      const nextSessions = service.getNextSessions(parsedSchedule, 2);
      
      expect(nextSessions.length).toBe(2);
      expect(nextSessions[0].timeLabel).toBe('10:00 - 11:00');
      expect(nextSessions[1].timeLabel).toBe('15:00 - 16:00');
      
      // Jan 15 is Sunday, so next Monday is Jan 16, next Wednesday is Jan 18
      const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
      expect(formatDate(nextSessions[0].date)).toBe('2023-01-16');
      expect(formatDate(nextSessions[1].date)).toBe('2023-01-18');
    });
    
    test('should parse text schedule and get next sessions correctly', () => {
      const textSchedule = 'Понедельник: 10:00 - 11:00\nСреда: 15:00 - 16:00';
      const parsedSchedule = service.parseSchedule(textSchedule);
      const nextSessions = service.getNextSessions(parsedSchedule, 2);
      
      expect(nextSessions.length).toBe(2);
      expect(nextSessions[0].timeLabel).toBe('10:00 - 11:00');
      expect(nextSessions[1].timeLabel).toBe('15:00 - 16:00');
      
      // Jan 15 is Sunday, so next Monday is Jan 16, next Wednesday is Jan 18
      const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
      expect(formatDate(nextSessions[0].date)).toBe('2023-01-16');
      expect(formatDate(nextSessions[1].date)).toBe('2023-01-18');
    });
  });
  
  describe('parseSchedule and getNextLessonDates integration', () => {
    test('should parse schedule and convert to proper date objects with time', () => {
      const jsonSchedule = '{"Понедельник":"10:00 - 11:00","Среда":"15:30 - 16:30"}';
      const parsedSchedule = service.parseSchedule(jsonSchedule);
      const nextDates = service.getNextLessonDates(parsedSchedule, 2);
      
      expect(nextDates.length).toBe(2);
      
      // Check first date (Monday at 10:00)
      expect(nextDates[0].getFullYear()).toBe(2023);
      expect(nextDates[0].getMonth()).toBe(0); // January
      expect(nextDates[0].getDate()).toBe(16); // 16th
      expect(nextDates[0].getHours()).toBe(10);
      expect(nextDates[0].getMinutes()).toBe(0);
      
      // Check second date (Wednesday at 15:30)
      expect(nextDates[1].getFullYear()).toBe(2023);
      expect(nextDates[1].getMonth()).toBe(0); // January
      expect(nextDates[1].getDate()).toBe(18); // 18th
      expect(nextDates[1].getHours()).toBe(15);
      expect(nextDates[1].getMinutes()).toBe(30);
    });
    
    test('should handle both formats in a real-world scenario', () => {
      // Тестируем обработку обоих форматов, как это происходит в реальном приложении
      const jsonSchedule = '{"Понедельник":"10:00 - 11:00","Пятница":"17:00 - 18:00"}';
      const textSchedule = 'Среда: 15:30 - 16:30\nПятница: 16:00 - 17:00';
      
      // Проверяем корректность парсинга обоих форматов
      const parsedJson = service.parseSchedule(jsonSchedule);
      const parsedText = service.parseSchedule(textSchedule);
      
      expect(parsedJson).toEqual({
        'Понедельник': '10:00 - 11:00',
        'Пятница': '17:00 - 18:00'
      });
      
      expect(parsedText).toEqual({
        'Среда': '15:30 - 16:30',
        'Пятница': '16:00 - 17:00'
      });
      
      // Проверяем получение дат занятий для обоих форматов
      const jsonDates = service.getNextLessonDates(parsedJson, 2);
      const textDates = service.getNextLessonDates(parsedText, 2);
      
      // JSON: Monday (Jan 16) at 10:00, Friday (Jan 20) at 17:00
      expect(jsonDates[0].getDate()).toBe(16);
      expect(jsonDates[0].getHours()).toBe(10);
      expect(jsonDates[1].getDate()).toBe(20);
      expect(jsonDates[1].getHours()).toBe(17);
      
      // Text: Wednesday (Jan 18) at 15:30, Friday (Jan 20) at 16:00
      expect(textDates[0].getDate()).toBe(18);
      expect(textDates[0].getHours()).toBe(15);
      expect(textDates[0].getMinutes()).toBe(30);
      expect(textDates[1].getDate()).toBe(20);
      expect(textDates[1].getHours()).toBe(16);
    });
  });
  
  describe('end-to-end schedule processing', () => {
    test('should handle full parsing, session calculation and formatting', () => {
      // Текстовый формат расписания как в приложении
      const scheduleString = 'Понедельник: 10:00 - 11:00\nСреда: 15:30 - 16:30';
      
      // Шаг 1: Парсинг расписания
      const schedule = service.parseSchedule(scheduleString);
      expect(schedule).not.toBeNull();
      
      // Шаг 2: Получение сессий
      const sessions = service.getNextSessions(schedule, 3);
      expect(sessions.length).toBe(2); // Только 2 сессии в неделю
      
      // Шаг 3: Получение дат
      const dates = service.getNextLessonDates(schedule, 3);
      expect(dates.length).toBe(2);
      
      // Шаг 4: Форматирование дат
      const formattedDate = service.formatDateTime(dates[0]);
      expect(formattedDate).toBe('16 января 2023 г. 10:00');
    });
    
    test('should handle real schedule strings from the application', () => {
      // Имитируем реальные строки расписания из приложения
      const scheduleStrings = [
        '{"Понедельник":"09:00 - 10:00","Среда":"09:00 - 10:00"}', // JSON формат
        'Понедельник: 09:00 - 10:00\nСреда: 09:00 - 10:00', // Текстовый формат
        'Понедельник: 09:00 - 10:00', // Одиночная строка
        '{"Понедельник":"09:00 - 10:00"}' // JSON с одним днем
      ];
      
      // Все эти строки должны быть успешно обработаны
      scheduleStrings.forEach(str => {
        const schedule = service.parseSchedule(str);
        expect(schedule).not.toBeNull();
        
        const sessions = service.getNextSessions(schedule, 2);
        expect(sessions.length).toBeGreaterThan(0);
        
        const dates = service.getNextLessonDates(schedule, 2);
        expect(dates.length).toBeGreaterThan(0);
      });
    });
  });
});