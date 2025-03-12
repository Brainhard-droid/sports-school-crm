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
import { Users, Calendar, Loader2 } from "lucide-react";
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

  const form = useForm<InsertGroup>({
    resolver: zodResolver(insertGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      trainer: 1,
      maxStudents: 10,
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
        title: "Success",
        description: "Group created successfully",
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
                          <Input {...field} />
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
                                {student.active ? 'Активный' : 'Неактивный'}
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups?.map((group) => (
            <Card
              key={group.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => {
                setSelectedGroup(group);
                setIsDetailsOpen(true);
              }}
            >
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Максимум учеников: {group.maxStudents}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGroup(group);
                        setScheduleDialogOpen(true);
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Добавить расписание
                    </Button>
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
      </div>
    </Layout>
  );
}