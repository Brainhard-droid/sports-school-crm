import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout/navbar";
import { Group, InsertGroup, insertGroupSchema, Schedule, InsertSchedule, insertScheduleSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Calendar, Loader2, Trash2, Archive, MoreVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DAYS_OF_WEEK = [
  { id: 1, name: "Понедельник" },
  { id: 2, name: "Вторник" },
  { id: 3, name: "Среда" },
  { id: 4, name: "Четверг" },
  { id: 5, name: "Пятница" },
  { id: 6, name: "Суббота" },
  { id: 7, name: "Воскресенье" },
];

export default function Groups() {
  const [open, setOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleTimes, setScheduleTimes] = useState<{ [key: number]: { startTime: string; endTime: string } }>({});
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [filters, setFilters] = useState({
    searchTerm: "",
    showArchived: false,
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const { data: schedules } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  const { data: groupStudents } = useQuery({
    queryKey: ["/api/group-students", selectedGroup?.id],
    queryFn: async () => {
      if (!selectedGroup) return null;
      const response = await fetch(`/api/group-students/${selectedGroup.id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch group students');
      }
      return response.json();
    },
    enabled: !!selectedGroup,
  });

  // Фильтрация групп
  const filteredGroups = groups?.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         (group.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ?? false);
    const matchesArchived = filters.showArchived ? true : group.active;

    return matchesSearch && matchesArchived;
  });

  const form = useForm<InsertGroup>({
    resolver: zodResolver(insertGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      trainer: 1,
      maxStudents: 10,
      active: true,
    },
  });

  const scheduleForm = useForm<InsertSchedule>({
    resolver: zodResolver(insertScheduleSchema),
    defaultValues: {
      groupId: 0,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: InsertGroup) => {
      const res = await apiRequest("POST", "/api/groups", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Успешно",
        description: "Группа создана",
      });
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: { groupId: number; schedules: InsertSchedule[] }) => {
      const promises = data.schedules.map(schedule =>
        apiRequest("POST", "/api/schedules", schedule)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setScheduleDialogOpen(false);
      setSelectedDays([]);
      setScheduleTimes({});
      toast({
        title: "Успешно",
        description: "Расписание добавлено",
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

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to delete group');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsDeleteDialogOpen(false);
      setGroupToDelete(null);
      toast({
        title: "Успешно",
        description: "Группа удалена",
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

  const handleDayChange = (dayId: number) => {
    setSelectedDays(prev => {
      const isSelected = prev.includes(dayId);
      if (isSelected) {
        const newTimes = { ...scheduleTimes };
        delete newTimes[dayId];
        setScheduleTimes(newTimes);
        return prev.filter(id => id !== dayId);
      } else {
        setScheduleTimes(prev => ({
          ...prev,
          [dayId]: { startTime: "09:00", endTime: "10:00" }
        }));
        return [...prev, dayId];
      }
    });
  };

  const handleTimeChange = (dayId: number, field: 'startTime' | 'endTime', value: string) => {
    setScheduleTimes(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], [field]: value }
    }));
  };

  const handleScheduleSubmit = async (groupId: number) => {
    const schedules = selectedDays.map(dayId => ({
      groupId,
      dayOfWeek: dayId,
      startTime: scheduleTimes[dayId].startTime,
      endTime: scheduleTimes[dayId].endTime
    }));

    await createScheduleMutation.mutateAsync({ groupId, schedules });
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    await deleteGroupMutation.mutateAsync(groupToDelete.id);
  };

  const handleToggleStatus = async (group: Group) => {
    await toggleStatusMutation.mutateAsync({
      id: group.id,
      active: !group.active
    });
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Группы</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Создать группу
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новую группу</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) =>
                    createGroupMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название группы</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxStudents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Максимум учеников</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Создать группу
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Фильтры */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex-1">
            <Input
              placeholder="Поиск по названию группы..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
          </div>
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups?.map((group) => (
            <Card
              key={group.id}
              className={`cursor-pointer transition-shadow hover:shadow-lg ${
                !group.active ? 'opacity-60' : ''
              }`}
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
                        setSelectedGroup(group);
                        setScheduleDialogOpen(true);
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Добавить расписание
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(group);
                      }}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      {group.active ? 'Архивировать' : 'Активировать'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGroupToDelete(group);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent
                onClick={() => {
                  setSelectedGroup(group);
                  setIsDetailsOpen(true);
                }}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Максимум учеников: {group.maxStudents}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      group.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {group.active ? 'Активная' : 'В архиве'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Расписание</h4>
                    {schedules
                      ?.filter((s) => s.groupId === group.id)
                      .map((schedule) => (
                        <div
                          key={schedule.id}
                          className="text-sm text-muted-foreground"
                        >
                          {DAYS_OF_WEEK.find(d => d.id === schedule.dayOfWeek)?.name}: {schedule.startTime} - {schedule.endTime}
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedGroup?.name}</DialogTitle>
              <CardDescription>{selectedGroup?.description}</CardDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Тренер</h3>
                  <p>ID: {selectedGroup?.trainer}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Максимум учеников</h3>
                  <p>{selectedGroup?.maxStudents}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Ученики группы</h3>
                {!groupStudents?.length ? (
                  <p className="text-muted-foreground">В группе нет учеников</p>
                ) : (
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-2 text-left">ФИО</th>
                          <th className="px-4 py-2 text-left">Телефон</th>
                          <th className="px-4 py-2 text-left">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupStudents.map((student) => (
                          <tr key={student.id} className="border-b">
                            <td className="px-4 py-2">{student.firstName} {student.lastName}</td>
                            <td className="px-4 py-2">{student.phoneNumber}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-sm ${
                                student.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {student.active ? 'Активный' : 'В архиве'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Расписание</h3>
                {schedules
                  ?.filter((s) => s.groupId === selectedGroup?.id)
                  .map((schedule) => (
                    <div
                      key={schedule.id}
                      className="text-sm text-muted-foreground"
                    >
                      {DAYS_OF_WEEK.find(d => d.id === schedule.dayOfWeek)?.name}: {schedule.startTime} - {schedule.endTime}
                    </div>
                  ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Диалог добавления расписания */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Добавить расписание</DialogTitle>
              <DialogDescription>
                Выберите дни недели и укажите время занятий
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Выберите дни недели</h4>
                <div className="grid grid-cols-2 gap-4">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.id}`}
                        checked={selectedDays.includes(day.id)}
                        onCheckedChange={() => handleDayChange(day.id)}
                      />
                      <label
                        htmlFor={`day-${day.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {day.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDays.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Время занятий</h4>
                  {selectedDays.map((dayId) => (
                    <div key={dayId} className="space-y-2">
                      <p className="text-sm">{DAYS_OF_WEEK.find(d => d.id === dayId)?.name}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm">Начало</label>
                          <Input
                            type="time"
                            value={scheduleTimes[dayId]?.startTime || "09:00"}
                            onChange={(e) => handleTimeChange(dayId, 'startTime', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm">Окончание</label>
                          <Input
                            type="time"
                            value={scheduleTimes[dayId]?.endTime || "10:00"}
                            onChange={(e) => handleTimeChange(dayId, 'endTime', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => handleScheduleSubmit(selectedGroup!.id)}
                disabled={selectedDays.length === 0 || createScheduleMutation.isPending}
              >
                {createScheduleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить расписание"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Диалог подтверждения удаления */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Группа и все связанные с ней данные будут полностью удалены из системы.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGroup}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteGroupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Удаление...
                  </>
                ) : (
                  "Удалить"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}