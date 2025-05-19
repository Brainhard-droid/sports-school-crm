import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, getResponseData } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { User, UserRole } from '@shared/schema';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// Импорт компонентов
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, PlusCircle, Trash2, UserPlus } from 'lucide-react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Форма создания нового пользователя
const CreateUserForm = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Определяем схему формы
  const formSchema = z.object({
    email: z.string().email(t('validation.emailInvalid')),
    role: z.enum([UserRole.OWNER, UserRole.ADMIN, UserRole.TRAINER, UserRole.EMPLOYEE])
  });

  // Инициализируем форму
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: UserRole.TRAINER
    }
  });

  // Мутация для создания пользователя
  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest('POST', '/api/users', data);
      return getResponseData(response);
    },
    onSuccess: () => {
      toast({
        title: t('settings.users.userCreated'),
        description: t('settings.users.userCreatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.users.createError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Обработчик отправки формы
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createUserMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.email')}</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="email@example.com" />
              </FormControl>
              <FormDescription>
                {t('settings.users.emailDesc')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('settings.users.role')}</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('settings.users.selectRole')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UserRole.OWNER}>{t('roles.owner')}</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>{t('roles.admin')}</SelectItem>
                  <SelectItem value={UserRole.TRAINER}>{t('roles.trainer')}</SelectItem>
                  <SelectItem value={UserRole.EMPLOYEE}>{t('roles.employee')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {t('settings.users.roleDesc')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={createUserMutation.isPending}>
            {createUserMutation.isPending ? t('loading') : t('settings.users.createUser')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

// Страница управления правами доступа
const UserPermissionsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isOwner } = usePermissions();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Получение всех пользователей
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isOwner, // Загружаем данные только для владельца
  });

  // Мутация для обновления роли пользователя
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await apiRequest('PATCH', `/api/users/${userId}/role`, { role });
      return getResponseData(response);
    },
    onSuccess: () => {
      toast({
        title: t('settings.users.roleUpdated'),
        description: t('settings.users.roleUpdatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.users.roleUpdateError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Мутация для удаления пользователя
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/users/${userId}`);
      return getResponseData(response);
    },
    onSuccess: () => {
      toast({
        title: t('settings.users.userDeleted'),
        description: t('settings.users.userDeletedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.users.deleteError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Обработчик изменения роли
  const handleRoleChange = (userId: number, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  // Обработчик удаления пользователя
  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  if (!isOwner) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">{t('settings.permissions.title')}</h1>
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t('permissions.accessDenied')}</AlertTitle>
          <AlertDescription>
            {t('permissions.ownerRoleRequired')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('settings.permissions.title')}</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {t('settings.users.addUser')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('settings.users.createNewUser')}</DialogTitle>
              <DialogDescription>
                {t('settings.users.createUserDesc')}
              </DialogDescription>
            </DialogHeader>
            <CreateUserForm onClose={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-gray-500 mb-6">{t('settings.permissions.description')}</p>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.users.title')}</CardTitle>
          <CardDescription>{t('settings.users.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">{t('loading')}</div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="p-4 border rounded-md flex justify-between items-center">
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {t(`roles.${user.role}`)}
                    </Badge>
                    <div className="flex gap-2">
                      {user.role !== UserRole.OWNER && (
                        <Button 
                          size="sm"
                          onClick={() => handleRoleChange(user.id, UserRole.OWNER)}
                        >
                          {t('roles.owner')}
                        </Button>
                      )}
                      {user.role !== UserRole.ADMIN && (
                        <Button 
                          size="sm"
                          onClick={() => handleRoleChange(user.id, UserRole.ADMIN)}
                        >
                          {t('roles.admin')}
                        </Button>
                      )}
                      {user.role !== UserRole.TRAINER && (
                        <Button 
                          size="sm"
                          onClick={() => handleRoleChange(user.id, UserRole.TRAINER)}
                        >
                          {t('roles.trainer')}
                        </Button>
                      )}
                      {user.role !== UserRole.EMPLOYEE && (
                        <Button 
                          size="sm"
                          onClick={() => handleRoleChange(user.id, UserRole.EMPLOYEE)}
                        >
                          {t('roles.employee')}
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setUserToDelete(user)}
                            disabled={user.role === UserRole.OWNER && users.filter(u => u.role === UserRole.OWNER).length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('settings.users.deleteUser')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('settings.users.deleteUserConfirm', { username: userToDelete?.username })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteUser}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {t('delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPermissionsPage;