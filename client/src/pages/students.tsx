import { useState } from 'react';
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
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function StudentsPage() {
  const [filters, setFilters] = useState({
    searchTerm: '',
    showArchived: false,
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { students, statistics, isLoading, error } = useStudents({
    searchTerm: filters.searchTerm,
    showArchived: filters.showArchived,
  });

  const handleFiltersChange = (newFilters: { searchTerm: string; showArchived: boolean }) => {
    setFilters(newFilters);
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

      <Tabs defaultValue="all">
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
            filters={filters} 
            onFiltersChange={handleFiltersChange} 
          />
          {viewMode === 'grid' ? (
            <StudentsGrid 
              students={students} 
              isLoading={isLoading} 
              error={error} 
            />
          ) : (
            <StudentsList 
              students={students} 
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="active">
          <StudentFilters 
            filters={{ ...filters, showArchived: false }} 
            onFiltersChange={handleFiltersChange} 
          />
          {viewMode === 'grid' ? (
            <StudentsGrid 
              students={students.filter(s => s.active)} 
              isLoading={isLoading} 
              error={error} 
            />
          ) : (
            <StudentsList 
              students={students.filter(s => s.active)} 
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="archived">
          <StudentFilters 
            filters={{ ...filters, showArchived: true }} 
            onFiltersChange={handleFiltersChange} 
          />
          {viewMode === 'grid' ? (
            <StudentsGrid 
              students={students.filter(s => !s.active)} 
              isLoading={isLoading} 
              error={error} 
            />
          ) : (
            <StudentsList 
              students={students.filter(s => !s.active)} 
              isLoading={isLoading}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}