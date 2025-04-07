import { Student } from '@shared/schema';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Archive, RotateCcw, Trash, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { calculateAge } from '@/lib/utils';

interface StudentListItemProps {
  student: Student;
}

export function StudentListItem({ student }: StudentListItemProps) {
  const age = student.birthDate ? calculateAge(new Date(student.birthDate)) : null;
  
  return (
    <div className={`grid grid-cols-12 gap-2 p-4 border-t first:border-t-0 hover:bg-muted/30 transition-colors ${!student.active ? 'opacity-60' : ''}`}>
      <div className="col-span-4 flex flex-col">
        <div className="font-medium">{student.firstName} {student.lastName}</div>
        {!student.active && <Badge variant="outline" className="w-fit text-xs mt-1">Архив</Badge>}
      </div>
      
      <div className="col-span-2 text-muted-foreground text-sm flex items-center">
        {age !== null 
          ? `${age} ${age === 1 ? 'год' : age < 5 ? 'года' : 'лет'}`
          : 'Не указан'
        }
      </div>
      
      <div className="col-span-3 text-sm">
        <div>{student.parentPhone || student.phoneNumber || 'Телефон не указан'}</div>
        <div className="text-muted-foreground">{student.parentName || 'Родитель не указан'}</div>
      </div>
      
      <div className="col-span-2 text-sm flex items-center gap-1">
        {student.groups && student.groups.length > 0 
          ? student.groups.map(group => (
              <Badge key={group.id} variant="outline">{group.name}</Badge>
            ))
          : <span className="text-muted-foreground">Без группы</span>
        }
      </div>
      
      <div className="col-span-1 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UserPlus className="mr-2 h-4 w-4" />
              Добавить в группу
            </DropdownMenuItem>
            {student.active ? (
              <DropdownMenuItem>
                <Archive className="mr-2 h-4 w-4" />
                Архивировать
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>
                <RotateCcw className="mr-2 h-4 w-4" />
                Восстановить
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}