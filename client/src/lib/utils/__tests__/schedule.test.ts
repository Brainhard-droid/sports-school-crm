import { test, expect, describe } from '@jest/globals';
import { timeToMinutes, sortWeekdays, sortSchedule, isValidDateString } from '../schedule';
import type { Schedule } from '../../../services/ScheduleService';

describe('schedule utils', () => {
  describe('timeToMinutes', () => {
    test('should convert time to minutes for simple time', () => {
      expect(timeToMinutes('10:30')).toBe(630); // 10 hours * 60 + 30 minutes
    });
    
    test('should handle time ranges by taking the start time', () => {
      expect(timeToMinutes('10:30 - 11:45')).toBe(630);
    });
    
    test('should return 0 for invalid time format', () => {
      expect(timeToMinutes('invalid')).toBe(0);
    });
  });
  
  describe('sortWeekdays', () => {
    test('should sort weekdays in correct order starting with Monday', () => {
      const input = ['Воскресенье', 'Вторник', 'Суббота', 'Понедельник'];
      const expected = ['Понедельник', 'Вторник', 'Суббота', 'Воскресенье'];
      
      expect(sortWeekdays(input)).toEqual(expected);
    });
    
    test('should handle empty array', () => {
      expect(sortWeekdays([])).toEqual([]);
    });
    
    test('should handle unknown days', () => {
      const input = ['Понедельник', 'Unknown', 'Вторник'];
      const expected = ['Понедельник', 'Вторник', 'Unknown'];
      
      expect(sortWeekdays(input)).toEqual(expected);
    });
  });
  
  describe('sortSchedule', () => {
    test('should sort schedule by days and times', () => {
      const input: Schedule = {
        'Среда': ['18:00 - 19:00', '15:00 - 16:00'],
        'Понедельник': '10:00 - 11:00',
        'Пятница': '17:00 - 18:00'
      };
      
      const expected: Schedule = {
        'Понедельник': '10:00 - 11:00',
        'Среда': ['15:00 - 16:00', '18:00 - 19:00'],
        'Пятница': '17:00 - 18:00'
      };
      
      expect(sortSchedule(input)).toEqual(expected);
    });
    
    test('should handle empty schedule', () => {
      expect(sortSchedule({})).toEqual({});
    });
  });
  
  describe('isValidDateString', () => {
    test('should return true for valid date string', () => {
      expect(isValidDateString('2023-01-15')).toBe(true);
    });
    
    test('should return true for valid date-time string', () => {
      expect(isValidDateString('2023-01-15T10:30:00')).toBe(true);
    });
    
    test('should return false for invalid date string', () => {
      expect(isValidDateString('invalid-date')).toBe(false);
    });
    
    test('should return false for empty string', () => {
      expect(isValidDateString('')).toBe(false);
    });
    
    test('should return false for null', () => {
      expect(isValidDateString(null)).toBe(false);
    });
    
    test('should return false for undefined', () => {
      expect(isValidDateString(undefined)).toBe(false);
    });
  });
});