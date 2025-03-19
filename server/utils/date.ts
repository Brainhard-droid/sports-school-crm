import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "d MMMM yyyy 'в' HH:mm", { locale: ru });
}
