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
import { Users, Calendar } from "lucide-react";
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

export default function Groups() {
  const [open, setOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const { data: schedules } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  // Получение списка студентов в группе
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
    mutationFn: async (data: InsertSchedule) => {
      const res = await apiRequest("POST", "/api/schedules", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
    },
  });

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

        {/* Модальное окно деталей группы */}
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
                      День {schedule.dayOfWeek}: {schedule.startTime} - {schedule.endTime}
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Добавить расписание
                        </Button>
                      </DialogTrigger>
                      <DialogContent onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                          <DialogTitle>Добавить расписание</DialogTitle>
                        </DialogHeader>
                        <Form {...scheduleForm}>
                          <form
                            onSubmit={scheduleForm.handleSubmit((data) =>
                              createScheduleMutation.mutate({
                                ...data,
                                groupId: group.id,
                              })
                            )}
                            className="space-y-4"
                          >
                            <FormField
                              control={scheduleForm.control}
                              name="dayOfWeek"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>День недели</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="7"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={scheduleForm.control}
                              name="startTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Время начала</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={scheduleForm.control}
                              name="endTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Время окончания</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full">
                              Добавить расписание
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
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
                          День {schedule.dayOfWeek}: {schedule.startTime} -{" "}
                          {schedule.endTime}
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