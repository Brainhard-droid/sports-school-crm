import React from 'react';
import { StudentListItem } from './student-list-item';
import { Student } from '@shared/schema';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StudentsListProps {
  students: Student[];
  isLoading: boolean;
  onArchive: (studentId: number) => void;
}

export const StudentsList: React.FC<StudentsListProps> = ({ 
  students, 
  isLoading, 
  onArchive
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('students.noStudentsFound')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md shadow-sm">
      {students.map((student) => (
        <StudentListItem 
          key={student.id} 
          student={student} 
          onArchive={onArchive}
        />
      ))}
    </div>
  );
};