import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Group, InsertGroup } from "@shared/schema";
import { Calendar, Archive, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GroupCardProps {
  group: Group;
  onScheduleClick: (group: Group) => void;
  onEditClick: (group: Group) => void;
  onDeleteClick: (group: Group) => void;
  onDetailsClick: (group: Group) => void;
}

export function GroupCard({
  group,
  onScheduleClick,
  onEditClick,
  onDeleteClick,
  onDetailsClick,
}: GroupCardProps) {
  const { toast } = useToast();

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await fetch(`/api/groups/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to update group status');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Успешно",
        description: "Статус группы обновлен",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleStatus = async () => {
    await toggleStatusMutation.mutateAsync({
      id: group.id,
      active: !group.active
    });
  };

  return (
    <Card
      key={group.id}
      className={`cursor-pointer transition-shadow hover:shadow-lg ${
        !group.active ? 'opacity-60' : ''
      }`}
      onClick={() => onDetailsClick(group)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{group.name}</CardTitle>
          <CardDescription>{group.description}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onScheduleClick(group);
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Добавить расписание
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus();
              }}
            >
              <Archive className="mr-2 h-4 w-4" />
              {group.active ? 'Архивировать' : 'Активировать'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(group);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(group);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <p>Учеников: {group.currentStudents || 0} / {group.maxStudents}</p>
          <p>Тренер: {group.trainerName || 'Не назначен'}</p>
          <p>Статус: {group.active ? 'Активна' : 'Архив'}</p>
        </div>
      </CardContent>
    </Card>
  );
}