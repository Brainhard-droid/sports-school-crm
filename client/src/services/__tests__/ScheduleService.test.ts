import { test, expect, describe } from '@jest/globals';
import { ScheduleService } from '../ScheduleService';
import type { Schedule } from '../ScheduleService';
import { format, addDays } from 'date-fns';

describe('ScheduleService', () => {
  const service = new ScheduleService();

  describe('parseSchedule', () => {
    test('should parse a valid schedule JSON string', () => {
      const scheduleString = '{"Понедельник":"10:00 - 11:00","Среда":["15:00 - 16:00","18:00 - 19:00"]}';
      const expected: Schedule = {
        'Понедельник': '10:00 - 11:00',
        'Среда': ['15:00 - 16:00', '18:00 - 19:00']
      };
      
      const result = service.parseSchedule(scheduleString);
      expect(result).toEqual(expected);
    });

    test('should parse a valid schedule text format', () => {
      const scheduleString = 'Понедельник: 10:00 - 11:00\nСреда: 15:00 - 16:00\nСреда: 18:00 - 19:00';
      const expected: Schedule = {
        'Понедельник': '10:00 - 11:00',
        'Среда': ['15:00 - 16:00', '18:00 - 19:00']
      };
      
      const result = service.parseSchedule(scheduleString);
      expect(result).toEqual(expected);
    });

    test('should correctly identify and parse text format that starts with day name', () => {
      const scheduleString = 'Вторник: 14:00 - 15:30';
      const expected: Schedule = { 'Вторник': '14:00 - 15:30' };
      
      const result = service.parseSchedule(scheduleString);
      expect(result).toEqual(expected);
    });

    test('should return null for undefined schedule', () => {
      const result = service.parseSchedule(undefined);
      expect(result).toBeNull();
    });

    test('should return null for null schedule', () => {
      const result = service.parseSchedule(null);
      expect(result).toBeNull();
    });

    test('should return null if schedule is not an object in JSON and has no valid text format', () => {
      const result = service.parseSchedule('"string"');
      expect(result).toBeNull();
    });

    test('should return null if both JSON and text formats fail', () => {
      const result = service.parseSchedule('no valid schedule format');
      expect(result).toBeNull();
    });

    test('should handle empty lines in text format', () => {
      const scheduleString = 'Понедельник: 10:00 - 11:00\n\nСреда: 15:00 - 16:00';
      const expected: Schedule = {
        'Понедельник': '10:00 - 11:00',
        'Среда': '15:00 - 16:00'
      };
      
      const result = service.parseSchedule(scheduleString);
      expect(result).toEqual(expected);
    });

    test('should return null for empty schedule after processing', () => {
      const result = service.parseSchedule('   ');
      expect(result).toBeNull();
    });
  });

  describe('formatDateTime', () => {
    test('should format date properly', () => {
      const date = new Date(2023, 0, 15, 10, 30); // Jan 15, 2023, 10:30
      const expected = '15 января 2023 г. 10:30';
      
      const result = service.formatDateTime(date);
      expect(result).toBe(expected);
    });

    test('should handle string dates', () => {
      const date = '2023-01-15T10:30:00';
      const expected = '15 января 2023 г. 10:30';
      
      const result = service.formatDateTime(date);
      expect(result).toBe(expected);
    });
  });

  describe('getNextSessions', () => {
    // Mock the date to have predictable results
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
    
    test('should return empty array for null schedule', () => {
      const result = service.getNextSessions(null, 3);
      expect(result).toEqual([]);
    });
    
    test('should get next sessions based on schedule', () => {
      const schedule: Schedule = {
        'Понедельник': '10:00 - 11:00',
        'Среда': ['15:00 - 16:00', '18:00 - 19:00']
      };
      
      // Jan 15 is Sunday, so next Monday is Jan 16, next Wednesday is Jan 18
      const expected = [
        {
          date: new Date(2023, 0, 16), // Monday
          timeLabel: '10:00 - 11:00'
        },
        {
          date: new Date(2023, 0, 18), // Wednesday
          timeLabel: '15:00 - 16:00'
        },
        {
          date: new Date(2023, 0, 18), // Wednesday
          timeLabel: '18:00 - 19:00'
        }
      ];
      
      const result = service.getNextSessions(schedule, 3);
      
      // Only compare dates by day, month, year to avoid time zone issues
      const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
      const formattedResult = result.map(item => ({
        ...item,
        date: formatDate(item.date)
      }));
      const formattedExpected = expected.map(item => ({
        ...item,
        date: formatDate(item.date)
      }));
      
      expect(formattedResult).toEqual(formattedExpected);
    });
    
    test('should limit results to count parameter', () => {
      const schedule: Schedule = {
        'Понедельник': '10:00 - 11:00',
        'Среда': ['15:00 - 16:00', '18:00 - 19:00'],
        'Пятница': '17:00 - 18:00'
      };
      
      const result = service.getNextSessions(schedule, 2);
      expect(result.length).toBe(2);
    });
  });

  describe('getNextLessonDates', () => {
    // Mock date for consistent testing
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
    
    test('should return empty array for null schedule', () => {
      const result = service.getNextLessonDates(null, 3);
      expect(result).toEqual([]);
    });
    
    test('should convert session times to Date objects', () => {
      const schedule: Schedule = {
        'Понедельник': '10:00 - 11:00'
      };
      
      const result = service.getNextLessonDates(schedule, 1);
      
      // Monday Jan 16, 2023 at 10:00
      const expected = new Date(2023, 0, 16, 10, 0);
      
      // Compare only hour and minute to avoid timezone issues
      expect(result[0].getHours()).toBe(expected.getHours());
      expect(result[0].getMinutes()).toBe(expected.getMinutes());
    });
  });
});