import { Student } from '@shared/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Link } from 'wouter';

interface StudentListItemProps {
  student: Student;
  onArchive: (studentId: number) => void;
}

export function StudentListItem({ student, onArchive }: StudentListItemProps) {
  // Вычисляем возраст из даты рождения
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const age = student.birthDate ? calculateAge(new Date(student.birthDate)) : 0;
  
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary w-10 h-10 rounded-full flex items-center justify-center">
          <UserIcon className="h-5 w-5" />
        </div>
        <div>
          <Link href={`/students/${student.id}`}>
            <span className="font-medium hover:text-primary transition-colors cursor-pointer">
              {student.firstName} {student.lastName}
            </span>
          </Link>
          <div className="text-sm text-muted-foreground mt-0.5 flex gap-2">
            <span>{age} лет</span>
            {student.groups && student.groups.length > 0 && (
              <>
                <span>•</span>
                <span>{student.groups[0].name}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Действия</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/students/${student.id}`}>
                Просмотреть профиль
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/students/${student.id}/edit`}>
                Редактировать
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onArchive(student.id)}
              className="text-destructive"
            >
              Архивировать
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}