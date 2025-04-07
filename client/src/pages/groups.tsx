import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Group } from "@shared/schema";
import { Loader2 } from "lucide-react";

import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupCard } from "@/components/groups/group-card";
import { EditGroupDialog } from "@/components/groups/edit-group-dialog";
import { ScheduleDialog } from "@/components/groups/schedule-dialog";
import { DeleteGroupDialog } from "@/components/groups/delete-group-dialog";
import { GroupFilters } from "@/components/groups/group-filters";
import { useGroups } from "@/hooks/use-groups";
import { useLocation } from "wouter";

export default function Groups() {
  const [, navigate] = useLocation();
  const { groups, isLoading, filterGroups } = useGroups();
  
  // Состояния
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: "",
    showArchived: false,
  });

  // Обработчики событий
  const handleScheduleClick = (group: Group) => {
    setSelectedGroup(group);
    setScheduleDialogOpen(true);
  };

  const handleEditClick = (group: Group) => {
    setSelectedGroup(group);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (group: Group) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  const handleDetailsClick = (group: Group) => {
    navigate(`/groups/${group.id}`);
  };

  // Фильтрация групп
  const filteredGroups = filterGroups(filters);

  // Рендеринг загрузки
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Группы</h1>
        <CreateGroupDialog />
      </div>

      <GroupFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onScheduleClick={handleScheduleClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onDetailsClick={handleDetailsClick}
          />
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            {filters.searchTerm
              ? "Нет групп, соответствующих вашему поиску"
              : "Нет созданных групп"}
          </p>
        </div>
      )}

      <EditGroupDialog
        group={selectedGroup}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <ScheduleDialog
        group={selectedGroup}
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
      />

      <DeleteGroupDialog
        group={selectedGroup}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  );
}