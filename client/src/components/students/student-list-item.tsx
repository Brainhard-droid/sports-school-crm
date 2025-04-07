import { Student } from '@shared/schema';
import { Calendar, MoreHorizontal, User, Pencil, Trash2, Users, X, Archive } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { EditStudentDialog } from './edit-student-dialog';
import { DeleteStudentDialog } from './delete-student-dialog';
import { AddToGroupDialog } from './add-to-group-dialog';
import { calculateAge } from '@/lib/utils';

interface StudentListItemProps {
  student: Student;
  onArchive: (studentId: number) => void;
}

export function StudentListItem({ student, onArchive }: StudentListItemProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addToGroupDialogOpen, setAddToGroupDialogOpen] = useState(false);

  // Format birthdate
  const birthDate = student.birthDate 
    ? new Date(student.birthDate)
    : null;
  
  // Calculate age
  const age = birthDate ? calculateAge(birthDate) : null;

  // Format when birthdate was
  const birthDateFormatted = birthDate 
    ? formatDistanceToNow(birthDate, { addSuffix: true, locale: ru }) 
    : '';

  const handleArchive = () => {
    onArchive(student.id);
  };

  return (
    <>
      <div className={`flex items-center justify-between p-4 border-b hover:bg-muted/30 ${!student.active ? 'bg-muted/50 border-dashed' : ''}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-base font-medium truncate">
                {student.firstName} {student.lastName}
              </h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {student.groups && student.groups.map(group => (
                  <Badge key={group.id} variant="outline" className="text-xs">
                    {group.name}
                  </Badge>
                ))}
                {!student.active && (
                  <Badge variant="secondary" className="border-dashed text-xs">
                    <X className="mr-1 h-3 w-3" /> Архив
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-4 ml-4">
          {birthDate && (
            <div className="hidden md:flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-3.5 w-3.5" />
              <span>{birthDateFormatted} ({age} лет)</span>
            </div>
          )}

          {student.phoneNumber && (
            <div className="hidden md:flex items-center text-sm text-muted-foreground">
              <User className="mr-1 h-3.5 w-3.5" />
              <span>{student.phoneNumber}</span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAddToGroupDialogOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Добавить в группу
              </DropdownMenuItem>
              {student.active ? (
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  Архивировать
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  Восстановить
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <EditStudentDialog 
        student={student} 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
      />
      <DeleteStudentDialog 
        student={student} 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
      />
      <AddToGroupDialog 
        student={student} 
        open={addToGroupDialogOpen} 
        onOpenChange={setAddToGroupDialogOpen} 
      />
    </>
  );
}