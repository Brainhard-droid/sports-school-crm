import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout/navbar";
import { Student, InsertStudent, insertStudentSchema, Group, InsertStudentGroup } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { Loader2, UserPlus, Pencil, MoreVertical, Archive, Trash2, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
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


export default function StudentsPage() {
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    searchTerm: "",
    groupId: "",
    showArchived: false,
  });

  // Получение списка студентов
  const { data: students, isLoading, error } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    queryFn: async () => {
      if (!user) {
        setLocation('/auth');
        throw new Error('Unauthorized');
      }

      const response = await fetch('/api/students', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.status === 401) {
        setLocation('/auth');
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      return response.json();
    },
    enabled: !!user,
  });

  // Получение списка групп
  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const response = await fetch('/api/groups', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      return response.json();
    }
  });

  // Получение групп для каждого студента
  const getStudentGroups = async (studentId: number) => {
    const response = await fetch(`/api/student-groups/${studentId}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch student groups');
    }
    return response.json();
  };

  // Фильтрация студентов
  const filteredStudents = students?.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      student.phoneNumber.includes(filters.searchTerm) ||
      student.parentName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      student.parentPhone?.includes(filters.searchTerm);

    const matchesGroup = !filters.groupId || student.groups?.some(g => g.id.toString() === filters.groupId);
    const matchesArchived = filters.showArchived ? true : student.active;

    return matchesSearch && matchesGroup && matchesArchived;
  });

  const form = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: new Date().toISOString().split('T')[0],
      phoneNumber: "",
      parentName: "",
      parentPhone: "",
      active: true,
    },
  });

  const editForm = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertStudent) => {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (res.status === 401) {
        setLocation('/auth');
        throw new Error('Unauthorized');
      }

      if (!res.ok) {
        throw new Error('Failed to create student');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Успешно",
        description: "Студент успешно добавлен",
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

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; student: Partial<InsertStudent> }) => {
      const res = await fetch(`/api/students/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.student),
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to update student');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      editForm.reset();
      toast({
        title: "Успешно",
        description: "Информация о студенте обновлена",
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

  const addToGroupMutation = useMutation({
    mutationFn: async (data: InsertStudentGroup) => {
      const res = await fetch('/api/student-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to add student to group');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsGroupDialogOpen(false);
      setSelectedStudent(null);
      setSelectedGroup("");
      toast({
        title: "Успешно",
        description: "Студент добавлен в группу",
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
      const res = await fetch(`/api/students/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to update student status');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Успешно",
        description: "Статус студента обновлен",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to delete student');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      toast({
        title: "Успешно",
        description: "Студент удален",
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

  const onSubmit = async (data: InsertStudent) => {
    await createMutation.mutateAsync(data);
  };

  const handleAddToGroup = async () => {
    if (!selectedStudent || !selectedGroup) return;

    await addToGroupMutation.mutateAsync({
      studentId: selectedStudent.id,
      groupId: parseInt(selectedGroup),
      active: true,
    });
  };

  const handleEdit = async (data: InsertStudent) => {
    if (!selectedStudent) return;
    await updateMutation.mutateAsync({
      id: selectedStudent.id,
      student: data
    });
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    await deleteMutation.mutateAsync(selectedStudent.id);
  };

  const handleToggleStatus = async (student: Student) => {
    await toggleStatusMutation.mutateAsync({
      id: student.id,
      active: !student.active
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 text-red-500">
          <p>Ошибка загрузки данных: {error.message}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Ученики</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Добавить ученика
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить нового ученика</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя</FormLabel>
                        <FormControl>
                          <Input placeholder="Введите имя" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Фамилия</FormLabel>
                        <FormControl>
                          <Input placeholder="Введите фамилию" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата рождения</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input placeholder="Введите телефон" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя родителя</FormLabel>
                        <FormControl>
                          <Input placeholder="Введите имя родителя" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="parentPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон родителя</FormLabel>
                        <FormControl>
                          <Input placeholder="Введите телефон родителя" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Добавление..." : "Добавить"}
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
              <SelectItem value="">Все группы</SelectItem>
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

        {/* Диалог редактирования */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать ученика</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите имя" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фамилия</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите фамилию" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата рождения</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Телефон</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите телефон" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя родителя</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите имя родителя" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="parentPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Телефон родителя</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите телефон родителя" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Диалог добавления в группу */}
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить ученика в группу</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label>Выберите группу</label>
                <Select
                  value={selectedGroup}
                  onValueChange={setSelectedGroup}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите группу" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups?.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddToGroup}
                disabled={!selectedGroup || addToGroupMutation.isPending}
                className="w-full"
              >
                {addToGroupMutation.isPending ? "Добавление..." : "Добавить в группу"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО</TableHead>
                <TableHead>Дата рождения</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Родитель</TableHead>
                <TableHead>Телефон родителя</TableHead>
                <TableHead>Группы</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filteredStudents?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Нет учеников
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>
                      {new Date(student.birthDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{student.phoneNumber}</TableCell>
                    <TableCell>{student.parentName}</TableCell>
                    <TableCell>{student.parentPhone}</TableCell>
                    <TableCell>
                      {student.groups?.map((group) => (
                        <Badge key={group.id} variant="secondary" className="mr-1">
                          {group.name}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        student.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.active ? 'Активный' : 'В архиве'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => {
                            setSelectedStudent(student);
                            editForm.reset(student);
                            setIsEditDialogOpen(true);
                          }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedStudent(student);
                            setIsGroupDialogOpen(true);
                          }}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Добавить в группу
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(student)}>
                            <Archive className="mr-2 h-4 w-4" />
                            {student.active ? 'Архивировать' : 'Активировать'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {/* Диалог подтверждения удаления */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Студент будет полностью удален из системы.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? (
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