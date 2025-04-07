import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/navbar";
import { Student, Group } from "@shared/schema";
import { useStudents } from "@/hooks/use-students";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateStudentDialog,
  StudentsGrid
} from "@/components/students";

export default function StudentsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: "",
    groupId: "all",
    showArchived: false,
  });

  // Загрузка списка групп для фильтрации
  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  // Используем хук для получения и фильтрации студентов
  const { students, isLoading, error } = useStudents({
    searchTerm: filters.searchTerm,
    showArchived: filters.showArchived,
  });

  // Дополнительно фильтруем по группе
  const filteredByGroupStudents = students.filter(student => {
    return filters.groupId === "all" || 
      (student.groups?.some(g => g.id.toString() === filters.groupId) ?? false);
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Ученики</h1>
          <CreateStudentDialog 
            open={createDialogOpen} 
            onOpenChange={setCreateDialogOpen}
            triggerButton={false}
          />
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Добавить ученика
          </Button>
        </div>

        {/* Фильтры */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex-1">
            <Input
              placeholder="Поиск по имени, телефону..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
          </div>
          <Select
            value={filters.groupId}
            onValueChange={(value) => setFilters(prev => ({ ...prev, groupId: value }))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Фильтр по группе" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все группы</SelectItem>
              {groups?.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Checkbox
              id="showArchived"
              checked={filters.showArchived}
              onCheckedChange={(checked) => 
                setFilters(prev => ({ ...prev, showArchived: checked as boolean }))
              }
            />
            <label htmlFor="showArchived" className="text-sm">
              Показать архивные
            </label>
          </div>
        </div>

        {/* Список студентов */}
        <StudentsGrid 
          students={filteredByGroupStudents} 
          isLoading={isLoading} 
          error={error} 
        />
      </div>
    </Layout>
  );
}