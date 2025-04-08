import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Group, InsertGroup, Schedule } from "@shared/schema";
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

// Функция для получения названия дня недели по его номеру
function getDayName(dayOfWeek: number): string {
  const days = [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
    "Воскресенье" // Повторяем для правильной индексации (1-7)
  ];
  return days[dayOfWeek] || "Неизвестный день";
}

interface GroupCardProps {
  group: Group & { 
    currentStudents?: number;
    trainerName?: string;
    schedule?: Schedule[];
  };
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
          <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onScheduleClick(group);
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Добавить расписание
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleToggleStatus();
              }}
            >
              <Archive className="mr-2 h-4 w-4" />
              {group.active ? 'Архивировать' : 'Активировать'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onEditClick(group);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
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
          {group.schedule && group.schedule.length > 0 && (
            <div className="mt-2 border-t pt-2">
              <p className="font-medium mb-1">Расписание:</p>
              <div className="space-y-1">
                {group.schedule.map((item, index) => (
                  <p key={index} className="text-xs">
                    {getDayName(item.dayOfWeek)}: {item.startTime} - {item.endTime}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}