import { Student } from '@shared/schema';
import { StudentListItem } from './student-list-item';
import { Loader2 } from 'lucide-react';

interface StudentsListProps {
  students: Student[];
  isLoading: boolean;
  error?: Error | null;
  onArchive: (studentId: number) => void;
}

export function StudentsList({ students, isLoading, error, onArchive }: StudentsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-destructive">
        <p>Произошла ошибка при загрузке списка учеников.</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg">Ученики не найдены</p>
        <p className="text-sm mt-2">Попробуйте изменить параметры поиска или добавьте нового ученика</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      {students.map((student) => (
        <StudentListItem 
          key={student.id} 
          student={student} 
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}