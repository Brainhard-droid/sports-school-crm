import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Student } from '@shared/schema';

interface UseStudentsProps {
  /**
   * Строка для поиска по имени, фамилии, контактам
   */
  searchTerm?: string;
  
  /**
   * Флаг для управления отображением архивных студентов
   * - true: только архивные
   * - false: только активные
   * - undefined: и архивные, и активные
   */
  showArchived?: boolean | undefined;
}

/**
 * Хук для работы со списком студентов
 * Обеспечивает получение, фильтрацию и статистику по студентам
 */
export function useStudents({ searchTerm = '', showArchived }: UseStudentsProps = {}) {
  // Получаем данные о студентах с сервера
  const { data: students = [], isLoading, error } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // Создаем отфильтрованный список студентов
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Фильтрация по статусу архивации
      if (showArchived === true && student.active) {
        return false; // Показываем только архивных
      }
      
      if (showArchived === false && !student.active) {
        return false; // Показываем только активных
      }
      
      // Если нет поискового запроса, возвращаем всех
      if (!searchTerm) {
        return true;
      }

      const searchTermLower = searchTerm.toLowerCase();

      // Поиск по имени студента
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      if (fullName.includes(searchTermLower)) {
        return true;
      }

      // Поиск по имени родителя
      if (student.parentName && student.parentName.toLowerCase().includes(searchTermLower)) {
        return true;
      }

      // Поиск по телефонам
      if (
        (student.phoneNumber && student.phoneNumber.includes(searchTerm)) ||
        (student.parentPhone && student.parentPhone.includes(searchTerm))
      ) {
        return true;
      }

      return false;
    });
  }, [students, searchTerm, showArchived]);

  // Статистика по студентам
  const statistics = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.active).length;
    const archived = total - active;
    
    // Подсчет студентов по группам
    const byGroup: Record<number, number> = {};
    students.forEach(student => {
      if (student.groups) {
        student.groups.forEach(group => {
          byGroup[group.id] = (byGroup[group.id] || 0) + 1;
        });
      }
    });

    // Подсчет студентов без групп
    const withoutGroup = students.filter(student => !student.groups || student.groups.length === 0).length;

    return {
      total,
      active,
      archived,
      byGroup,
      withoutGroup
    };
  }, [students]);

  return {
    students: filteredStudents,
    allStudents: students,
    isLoading,
    error,
    statistics,
  };
}