import { useState, useMemo } from 'react';
import { useStudents } from '@/hooks/use-students';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Student } from '@shared/schema';

// Компоненты
import { StudentsGrid } from '@/components/students/students-grid';
import { StudentsList } from '@/components/students/students-list';
import { StudentFilters } from '@/components/students/student-filters';
import { CreateStudentDialog } from '@/components/students';

import { Grid, List, UserRoundPlus, Users, UserPlus, UsersRound } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

/**
 * Страница управления учениками
 * Отображает список учеников с возможностью фильтрации и просмотра в виде сетки или списка
 */
export default function StudentsPage() {
  const { toast } = useToast();
  
  // Локальный стейт для фильтров и режима отображения
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tabValue, setTabValue] = useState<'all' | 'active' | 'archived' | 'newStudents'>('all');
  
  // Определяем стратегию фильтрации на основе выбранной вкладки
  const showArchived = useMemo(() => {
    if (tabValue === 'all') return undefined; // показываем всех
    if (tabValue === 'archived') return true; // только архивные
    return false; // только активные
  }, [tabValue]);

  // Загружаем данные с сервера
  const { students, statistics, isLoading, error } = useStudents({
    searchTerm,
    showArchived,
  });

  // Мутация для архивирования/восстановления студента
  const archiveMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const student = students.find(s => s.id === studentId);
      if (!student) throw new Error('Студент не найден');
      
      const newStatus = !student.active;
      const res = await apiRequest('PATCH', `/api/students/${studentId}/status`, { active: newStatus });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: 'Готово',
        description: 'Статус студента успешно изменен',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Обработчик изменения статуса студента (архивация/восстановление)
  const handleArchiveToggle = (studentId: number) => {
    archiveMutation.mutate(studentId);
  };

  return (
    <div className="container py-6">
      <header className="flex flex-col md:flex-row md:items-center mb-6 gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Ученики</h1>
          <p className="text-muted-foreground">
            Управление данными учеников и группами
          </p>
        </div>
        <CreateStudentDialog />
      </header>

      {/* Статистические карточки */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Всего учеников
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-3xl font-bold">{statistics.total}</p>
            <p className="text-sm text-muted-foreground">
              Активных: {statistics.active} | Архивных: {statistics.archived}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl flex items-center">
              <UserRoundPlus className="mr-2 h-5 w-5 text-primary" />
              Без группы
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-3xl font-bold">{statistics.withoutGroup}</p>
            <p className="text-sm text-muted-foreground">
              Ученики, не добавленные в группы
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Вкладки и списки учеников */}
      <Tabs 
        value={tabValue} 
        onValueChange={(value) => setTabValue(value as 'all' | 'active' | 'archived' | 'newStudents')}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1">
              <UsersRound className="h-4 w-4" />
              <span>Все ученики</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Активные</span>
            </TabsTrigger>
            <TabsTrigger value="newStudents" className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              <span>Новые ученики</span>
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-1">
              <UserRoundPlus className="h-4 w-4 opacity-50" />
              <span>Архивные</span>
            </TabsTrigger>
          </TabsList>
          
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}
            className="justify-end"
          >
            <ToggleGroupItem value="grid" aria-label="Отображать сеткой">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Отображать списком">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <TabsContent value="all">
          <StudentFilters 
            filters={{ searchTerm }} 
            onFiltersChange={({ searchTerm }) => setSearchTerm(searchTerm)} 
          />
          {renderStudentList(students, viewMode, isLoading, error, handleArchiveToggle)}
        </TabsContent>

        <TabsContent value="active">
          <StudentFilters 
            filters={{ searchTerm }} 
            onFiltersChange={({ searchTerm }) => setSearchTerm(searchTerm)} 
          />
          {renderStudentList(
            students.filter(s => s.active),
            viewMode, 
            isLoading,
            error, 
            handleArchiveToggle
          )}
        </TabsContent>

        <TabsContent value="newStudents">
          <StudentFilters 
            filters={{ searchTerm }} 
            onFiltersChange={({ searchTerm }) => setSearchTerm(searchTerm)} 
          />
          {renderStudentList(
            students.filter(s => s.active && (!s.groups || s.groups.length === 0)),
            viewMode, 
            isLoading,
            error, 
            handleArchiveToggle
          )}
        </TabsContent>

        <TabsContent value="archived">
          <StudentFilters 
            filters={{ searchTerm }} 
            onFiltersChange={({ searchTerm }) => setSearchTerm(searchTerm)} 
          />
          {renderStudentList(
            students.filter(s => !s.active),
            viewMode, 
            isLoading,
            error, 
            handleArchiveToggle
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Вспомогательная функция для рендеринга списка студентов
 * в зависимости от выбранного режима отображения
 */
function renderStudentList(
  students: Student[], 
  viewMode: 'grid' | 'list', 
  isLoading: boolean,
  error: Error | null, 
  onArchive: (studentId: number) => void
) {
  if (viewMode === 'grid') {
    return (
      <StudentsGrid 
        students={students} 
        isLoading={isLoading}
        error={error}
        onArchive={onArchive}
      />
    );
  }
  
  return (
    <StudentsList 
      students={students} 
      isLoading={isLoading}
      error={error}
      onArchive={onArchive}
    />
  );
}