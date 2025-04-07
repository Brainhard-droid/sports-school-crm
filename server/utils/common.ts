/**
 * Общие утилиты для использования в приложении
 */

/**
 * Форматирует дату в строку для отображения
 * 
 * @param date Дата для форматирования
 * @param includeTime Нужно ли включать время
 * @returns Отформатированная строка даты
 */
export function formatDate(date: Date, includeTime: boolean = false): string {
  if (!date) return '';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Date(date).toLocaleDateString('ru-RU', options);
}

/**
 * Обрабатывает ошибки и возвращает сообщение об ошибке
 * 
 * @param error Объект ошибки
 * @returns Сообщение об ошибке
 */
export function handleError(error: unknown): string {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    return error.message;
  } else if (typeof error === 'string') {
    console.error('Error:', error);
    return error;
  } else {
    console.error('Unknown error:', error);
    return 'Произошла неизвестная ошибка';
  }
}

/**
 * Проверяет, является ли значение валидным числом
 * 
 * @param value Значение для проверки
 * @returns true, если значение является числом и не NaN
 */
export function isValidNumber(value: any): boolean {
  if (value === null || value === undefined) return false;
  
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(parsed) && typeof parsed === 'number' && isFinite(parsed);
}

/**
 * Безопасно парсит целое число из строки или возвращает null
 * 
 * @param value Строка для парсинга
 * @returns Число или null, если парсинг невозможен
 */
export function safeParseInt(value: string | null | undefined): number | null {
  if (!value) return null;
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Проверяет, является ли значение валидным идентификатором
 * 
 * @param id Идентификатор для проверки
 * @returns true, если id является положительным целым числом
 */
export function isValidId(id: any): boolean {
  if (!isValidNumber(id)) return false;
  
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return Number.isInteger(numId) && numId > 0;
}