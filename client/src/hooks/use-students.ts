import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Student } from '@shared/schema';

interface UseStudentsProps {
  searchTerm?: string;
  showArchived?: boolean;
}

export function useStudents({ searchTerm = '', showArchived = false }: UseStudentsProps = {}) {
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  const { data: students = [], isLoading, error } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // Filter students based on searchTerm and showArchived
  useEffect(() => {
    const filtered = students.filter(student => {
      // Filter by archive status
      if (!showArchived && !student.active) {
        return false;
      }

      // If no search term, include all students
      if (!searchTerm) {
        return true;
      }

      const searchTermLower = searchTerm.toLowerCase();

      // Search in student name
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      if (fullName.includes(searchTermLower)) {
        return true;
      }

      // Search in parent name
      if (student.parentName && student.parentName.toLowerCase().includes(searchTermLower)) {
        return true;
      }

      // Search in phone numbers
      if (
        (student.phoneNumber && student.phoneNumber.includes(searchTerm)) ||
        (student.parentPhone && student.parentPhone.includes(searchTerm))
      ) {
        return true;
      }

      return false;
    });

    setFilteredStudents(filtered);
  }, [students, searchTerm, showArchived]);

  // Statistics
  const statistics = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.active).length;
    const archived = total - active;
    
    // Count students by group
    const byGroup: Record<number, number> = {};
    students.forEach(student => {
      if (student.groups) {
        student.groups.forEach(group => {
          byGroup[group.id] = (byGroup[group.id] || 0) + 1;
        });
      }
    });

    // Count students without groups
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