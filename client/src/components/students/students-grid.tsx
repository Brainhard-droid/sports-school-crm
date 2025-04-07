import { Student } from '@shared/schema';
import { StudentCard } from './student-card';
import { Loader2 } from 'lucide-react';

interface StudentsGridProps {
  students: Student[];
  isLoading: boolean;
  error: Error | null;
}

export function StudentsGrid({ students, isLoading, error }: StudentsGridProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {students.map((student) => (
        <StudentCard key={student.id} student={student} />
      ))}
    </div>
  );
}