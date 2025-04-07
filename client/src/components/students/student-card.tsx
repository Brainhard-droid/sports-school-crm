import { useState } from 'react';
import { Student } from '@shared/schema';
import { MoreHorizontal, Calendar, User, Pencil, Trash2, Users, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

interface StudentCardProps {
  student: Student;
}

export function StudentCard({ student }: StudentCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addToGroupDialogOpen, setAddToGroupDialogOpen] = useState(false);

  // Format birthdate
  const birthDate = student.birthDate 
    ? new Date(student.birthDate)
    : null;
  
  // Calculate age
  const age = birthDate 
    ? Math.floor((new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
    : null;

  // Format when birthdate was
  const birthDateFormatted = birthDate 
    ? formatDistanceToNow(birthDate, { addSuffix: true, locale: ru }) 
    : '';

  return (
    <>
      <Card className={`overflow-hidden transition-shadow hover:shadow-md ${!student.active ? 'bg-muted/50 border-dashed' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold">
                {student.firstName} {student.lastName}
              </CardTitle>
              {birthDate && (
                <CardDescription className="flex items-center mt-1">
                  <Calendar className="mr-1 h-3.5 w-3.5" />
                  {birthDateFormatted} ({age} лет)
                </CardDescription>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
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
        </CardHeader>
        <CardContent className="pb-2">
          {student.phoneNumber && (
            <p className="text-sm flex items-center mb-1">
              <User className="mr-2 h-3.5 w-3.5 opacity-70" />
              {student.phoneNumber}
            </p>
          )}
          {student.parentName && (
            <p className="text-sm flex items-center mb-1">
              <User className="mr-2 h-3.5 w-3.5 opacity-70" />
              {student.parentName} (родитель)
              {student.parentPhone && ` • ${student.parentPhone}`}
            </p>
          )}
        </CardContent>
        <CardFooter className="pt-2">
          <div className="flex flex-wrap gap-2 mt-2">
            {student.groups && student.groups.map(group => (
              <Badge key={group.id} variant="outline">
                {group.name}
              </Badge>
            ))}
            {!student.active && (
              <Badge variant="secondary" className="border-dashed bg-muted/50">
                <X className="mr-1 h-3 w-3" /> Архив
              </Badge>
            )}
          </div>
        </CardFooter>
      </Card>

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