import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, getResponseData } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Group, User } from '@shared/schema';
import { useTranslation } from 'react-i18next';

// Компоненты UI
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus, X } from 'lucide-react';

interface UserGroupAccessFormProps {
  userId: number;
}

// Схема формы для назначения группы пользователю
const formSchema = z.object({
  groupId: z.string().min(1, "Выберите группу"),
  accessType: z.enum(['view', 'edit', 'manage']).default('view')
});

type FormValues = z.infer<typeof formSchema>;

// Компонент для управления доступом пользователя к группам
export function UserGroupAccessForm({ userId }: UserGroupAccessFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [assignedGroups, setAssignedGroups] = useState<(Group & { accessType?: string })[]>([]);

  // Получение групп, доступных для назначения
  const { data: allGroups = [] } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });

  // Получение групп, назначенных пользователю
  const { data: userGroups = [], refetch: refetchUserGroups } = useQuery<(Group & { accessType?: string })[]>({
    queryKey: ['/api/users', userId, 'groups'],
    enabled: !!userId,
  });

  // Инициализация формы
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupId: '',
      accessType: 'view'
    }
  });

  // Обновление списка назначенных групп при изменении данных
  useEffect(() => {
    if (userGroups) {
      setAssignedGroups(userGroups);
    }
  }, [userGroups]);

  // Мутация для назначения группы пользователю
  const assignGroupMutation = useMutation({
    mutationFn: async (data: { userId: number; groupId: number; accessType: string }) => {
      const response = await apiRequest('POST', '/api/users/groups', data);
      return getResponseData(response);
    },
    onSuccess: () => {
      toast({
        title: t('settings.users.groupAssigned'),
        description: t('settings.users.groupAssignedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'groups'] });
      form.reset(); // Сбросить форму после успешного назначения
      refetchUserGroups(); // Обновить список групп пользователя
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.users.assignError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Мутация для удаления группы у пользователя
  const removeGroupMutation = useMutation({
    mutationFn: async ({ userId, groupId }: { userId: number; groupId: number }) => {
      const response = await apiRequest('DELETE', `/api/users/${userId}/groups/${groupId}`);
      return getResponseData(response);
    },
    onSuccess: () => {
      toast({
        title: t('settings.users.groupRemoved'),
        description: t('settings.users.groupRemovedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'groups'] });
      refetchUserGroups(); // Обновить список групп пользователя
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.users.removeError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Обработчик отправки формы
  const onSubmit = (data: FormValues) => {
    assignGroupMutation.mutate({
      userId,
      groupId: parseInt(data.groupId),
      accessType: data.accessType
    });
  };

  // Обработчик удаления группы
  const handleRemoveGroup = (groupId: number) => {
    removeGroupMutation.mutate({ userId, groupId });
  };

  // Получить неназначенные группы для выбора
  const getAvailableGroups = () => {
    const assignedGroupIds = assignedGroups.map(group => group.id);
    return allGroups.filter(group => !assignedGroupIds.includes(group.id));
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('settings.users.groupAccess')}</CardTitle>
        <CardDescription>{t('settings.users.groupAccessDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">{t('settings.users.assignedGroups')}</h3>
          {assignedGroups.length === 0 ? (
            <p className="text-gray-500">{t('settings.users.noAssignedGroups')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignedGroups.map((group) => (
                <Badge key={group.id} variant="outline" className="flex items-center gap-2 p-2">
                  <span>{group.name}</span>
                  <span className="text-xs">{group.accessType ? `(${t(`permissions.access.${group.accessType}`)})` : ''}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-5 w-5 rounded-full" 
                    onClick={() => handleRemoveGroup(group.id)}
                    disabled={removeGroupMutation.isPending}
                  >
                    {removeGroupMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t('settings.groups.select')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.groups.selectPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAvailableGroups().length === 0 ? (
                          <SelectItem value="no-groups" disabled>
                            {t('settings.groups.noAvailableGroups')}
                          </SelectItem>
                        ) : (
                          getAvailableGroups().map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessType"
                render={({ field }) => (
                  <FormItem className="w-full md:w-1/3">
                    <FormLabel>{t('permissions.accessType')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('permissions.selectAccessType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="view">{t('permissions.access.view')}</SelectItem>
                        <SelectItem value="edit">{t('permissions.access.edit')}</SelectItem>
                        <SelectItem value="manage">{t('permissions.access.manage')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('permissions.accessTypeDesc')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              disabled={assignGroupMutation.isPending || getAvailableGroups().length === 0}
              className="flex gap-2 items-center"
            >
              {assignGroupMutation.isPending 
                ? <Loader2 className="h-4 w-4 animate-spin" /> 
                : <UserPlus className="h-4 w-4" />}
              {t('settings.users.assignGroup')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}