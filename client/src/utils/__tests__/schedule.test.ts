import { 
  convertTextScheduleToJson, 
  convertJsonScheduleToText, 
  normalizeScheduleFormat 
} from '../schedule';

describe('Schedule Utilities', () => {
  describe('convertTextScheduleToJson', () => {
    test('should convert simple text schedule to JSON string', () => {
      const textSchedule = 'Понедельник: 10:00 - 11:00\nСреда: 15:00 - 16:00';
      const expected = '{"Понедельник":"10:00 - 11:00","Среда":"15:00 - 16:00"}';
      
      const result = convertTextScheduleToJson(textSchedule);
      expect(JSON.parse(result)).toEqual(JSON.parse(expected));
    });
    
    test('should handle multiple times for the same day', () => {
      const textSchedule = 'Понедельник: 10:00 - 11:00\nПонедельник: 12:00 - 13:00\nСреда: 15:00 - 16:00';
      const expected = '{"Понедельник":["10:00 - 11:00","12:00 - 13:00"],"Среда":"15:00 - 16:00"}';
      
      const result = convertTextScheduleToJson(textSchedule);
      expect(JSON.parse(result)).toEqual(JSON.parse(expected));
    });
    
    test('should handle empty or invalid lines', () => {
      const textSchedule = 'Понедельник: 10:00 - 11:00\n\nInvalid line\nСреда: 15:00 - 16:00';
      const expected = '{"Понедельник":"10:00 - 11:00","Среда":"15:00 - 16:00"}';
      
      const result = convertTextScheduleToJson(textSchedule);
      expect(JSON.parse(result)).toEqual(JSON.parse(expected));
    });
    
    test('should return empty object JSON for empty input', () => {
      const textSchedule = '';
      const expected = '{}';
      
      const result = convertTextScheduleToJson(textSchedule);
      expect(result).toEqual(expected);
    });
  });
  
  describe('convertJsonScheduleToText', () => {
    test('should convert simple JSON schedule to text', () => {
      const jsonSchedule = '{"Понедельник":"10:00 - 11:00","Среда":"15:00 - 16:00"}';
      const expected = 'Понедельник: 10:00 - 11:00\nСреда: 15:00 - 16:00';
      
      const result = convertJsonScheduleToText(jsonSchedule);
      expect(result).toEqual(expected);
    });
    
    test('should handle array of times', () => {
      const jsonSchedule = '{"Понедельник":["10:00 - 11:00","12:00 - 13:00"],"Среда":"15:00 - 16:00"}';
      const expected = 'Понедельник: 10:00 - 11:00\nПонедельник: 12:00 - 13:00\nСреда: 15:00 - 16:00';
      
      const result = convertJsonScheduleToText(jsonSchedule);
      expect(result).toEqual(expected);
    });
    
    test('should return empty string for invalid JSON', () => {
      const jsonSchedule = 'invalid json';
      
      const result = convertJsonScheduleToText(jsonSchedule);
      expect(result).toEqual('');
    });
    
    test('should handle empty object', () => {
      const jsonSchedule = '{}';
      
      const result = convertJsonScheduleToText(jsonSchedule);
      expect(result).toEqual('');
    });
  });
  
  describe('normalizeScheduleFormat', () => {
    test('should keep valid JSON as is', () => {
      const jsonSchedule = '{"Понедельник":"10:00 - 11:00","Среда":"15:00 - 16:00"}';
      
      const result = normalizeScheduleFormat(jsonSchedule);
      expect(JSON.parse(result)).toEqual(JSON.parse(jsonSchedule));
    });
    
    test('should convert text schedule to JSON', () => {
      const textSchedule = 'Понедельник: 10:00 - 11:00\nСреда: 15:00 - 16:00';
      const expected = '{"Понедельник":"10:00 - 11:00","Среда":"15:00 - 16:00"}';
      
      const result = normalizeScheduleFormat(textSchedule);
      expect(JSON.parse(result)).toEqual(JSON.parse(expected));
    });
    
    test('should handle invalid input gracefully', () => {
      const invalid = 'invalid input without proper format';
      
      const result = normalizeScheduleFormat(invalid);
      expect(result).toEqual('{}');
    });
    
    test('should handle edge cases', () => {
      // Пустая строка
      expect(normalizeScheduleFormat('')).toEqual('{}');
      
      // Строка с двоеточием, но не в формате дня недели
      const strange = 'Something: else';
      const result = normalizeScheduleFormat(strange);
      expect(JSON.parse(result)).toEqual({"Something": "else"});
    });
  });
});