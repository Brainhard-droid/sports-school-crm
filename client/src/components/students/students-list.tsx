import { Student } from '@shared/schema';
import { StudentListItem } from './student-list-item';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search } from 'lucide-react';

interface StudentsListProps {
  students: Student[];
  isLoading: boolean;
}

export function StudentsList({ students, isLoading }: StudentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Фильтрация студентов по поисковому запросу
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || 
      (student.parentName && student.parentName.toLowerCase().includes(searchLower)) ||
      (student.parentPhone && student.parentPhone.includes(searchTerm)) ||
      (student.phoneNumber && student.phoneNumber.includes(searchTerm));
  });
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени, родителю или телефону..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="border rounded-md">
        <div className="grid grid-cols-12 gap-2 p-4 bg-muted/40 font-medium">
          <div className="col-span-4">Ученик</div>
          <div className="col-span-2">Возраст</div>
          <div className="col-span-3">Контакты</div>
          <div className="col-span-2">Группы</div>
          <div className="col-span-1"></div>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Загрузка списка учеников...
          </div>
        ) : filteredStudents.length > 0 ? (
          <>
            {filteredStudents.map(student => (
              <StudentListItem key={student.id} student={student} />
            ))}
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {searchTerm 
              ? 'Не найдено учеников, соответствующих поисковому запросу' 
              : 'Список учеников пуст'}
          </div>
        )}
      </div>
    </div>
  );
}