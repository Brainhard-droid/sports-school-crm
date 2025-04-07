import { useState, useMemo } from 'react';
import { useStudents } from '@/hooks/use-students';
import { 
  CreateStudentDialog, 
  StudentFilters, 
  StudentsGrid,
  StudentsList
} from '@/components/students';

import { Grid, List, UserRoundPlus, Users } from 'lucide-react';
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
  // Локальный стейт для фильтров и режима отображения
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tabValue, setTabValue] = useState<'all' | 'active' | 'archived'>('all');
  
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

  // Фильтруем студентов на основе выбранной вкладки
  const filteredStudents = useMemo(() => {
    if (tabValue === 'all') return students;
    if (tabValue === 'archived') return students.filter(s => !s.active);
    return students.filter(s => s.active);
  }, [students, tabValue]);

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
        onValueChange={(value) => setTabValue(value as 'all' | 'active' | 'archived')}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <TabsList>
            <TabsTrigger value="all">Все ученики</TabsTrigger>
            <TabsTrigger value="active">Активные</TabsTrigger>
            <TabsTrigger value="archived">Архивные</TabsTrigger>
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
            filters={{ searchTerm, showArchived: false }} 
            onFiltersChange={(filters) => setSearchTerm(filters.searchTerm)} 
          />
          {renderStudentList(filteredStudents, viewMode, isLoading, error)}
        </TabsContent>

        <TabsContent value="active">
          <StudentFilters 
            filters={{ searchTerm, showArchived: false }} 
            onFiltersChange={(filters) => setSearchTerm(filters.searchTerm)} 
          />
          {renderStudentList(filteredStudents, viewMode, isLoading, error)}
        </TabsContent>

        <TabsContent value="archived">
          <StudentFilters 
            filters={{ searchTerm, showArchived: true }} 
            onFiltersChange={(filters) => setSearchTerm(filters.searchTerm)} 
          />
          {renderStudentList(filteredStudents, viewMode, isLoading, error)}
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
  students: any[], 
  viewMode: 'grid' | 'list', 
  isLoading: boolean, 
  error: Error | null
) {
  if (viewMode === 'grid') {
    return (
      <StudentsGrid 
        students={students} 
        isLoading={isLoading} 
        error={error} 
      />
    );
  }
  
  return (
    <StudentsList 
      students={students} 
      isLoading={isLoading}
    />
  );
}