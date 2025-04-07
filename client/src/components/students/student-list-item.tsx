import React from 'react';
import { Student } from '@shared/schema';
import { MoreHorizontal, Archive, UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateAge } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';

interface StudentListItemProps {
  student: Student;
  onArchive: (studentId: number) => void;
}

export const StudentListItem: React.FC<StudentListItemProps> = ({ student, onArchive }) => {
  const { t } = useTranslation();
  
  const age = student.birthDate ? calculateAge(new Date(student.birthDate)) : null;
  
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="font-medium">
              <Link href={`/students/${student.id}`}>
                {student.firstName} {student.lastName}
              </Link>
            </div>
            {age !== null && (
              <div className="text-sm text-muted-foreground">{t('students.age', { age })}</div>
            )}
          </div>
          
          <div className="flex flex-col sm:items-end">
            {student.phoneNumber && (
              <a 
                href={`tel:${student.phoneNumber}`} 
                className="text-sm hover:underline"
              >
                {student.phoneNumber}
              </a>
            )}
            {student.parentName && student.parentPhone && (
              <div className="text-sm text-muted-foreground">
                {student.parentName} • {student.parentPhone}
              </div>
            )}
          </div>
        </div>
        
        {student.groups && student.groups.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {student.groups.map((group) => (
              <div 
                key={group.id} 
                className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
              >
                {group.name}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-2">
            <MoreHorizontal className="h-5 w-5" />
            <span className="sr-only">Действия</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/students/${student.id}`} className="cursor-pointer">
              {t('students.viewProfile')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/students/${student.id}/edit`} className="cursor-pointer">
              {t('students.edit')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {student.active ? (
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => onArchive(student.id)}
            >
              <Archive className="mr-2 h-4 w-4" />
              {t('students.archive')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              onClick={() => onArchive(student.id)}
            >
              <UserRoundPlus className="mr-2 h-4 w-4" />
              {t('students.restore')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};