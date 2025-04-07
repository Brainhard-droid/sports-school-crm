import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, differenceInYears } from 'date-fns';
import { ru } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "d MMMM yyyy 'в' HH:mm", { locale: ru });
}

/**
 * Рассчитывает возраст на основе даты рождения
 */
export function calculateAge(birthDate: Date): number {
  return differenceInYears(new Date(), birthDate);
}