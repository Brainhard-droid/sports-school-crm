import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, getResponseData } from '@/lib/api';
import { z } from 'zod';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { User, UserRole, Group } from '@shared/schema';

// Импорт компонентов
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

// Вкладка "Управление пользователями"
const UserManagementTab = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isOwner } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

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

  // Обработчик изменения роли
  const handleRoleChange = (userId: number, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };

  if (!isOwner) {
    return (
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>{t('permissions.accessDenied')}</AlertTitle>
        <AlertDescription>
          {t('permissions.ownerRoleRequired')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.users.title')}</CardTitle>
        <CardDescription>{t('settings.users.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select
            value={selectedRole || ''}
            onValueChange={(value) => setSelectedRole(value || null)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('settings.users.filterByRole')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="">{t('settings.users.allRoles')}</SelectItem>
                <SelectItem value={UserRole.OWNER}>
                  {t('roles.owner')}
                </SelectItem>
                <SelectItem value={UserRole.ADMIN}>
                  {t('roles.admin')}
                </SelectItem>
                <SelectItem value={UserRole.TRAINER}>
                  {t('roles.trainer')}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings.users.username')}</TableHead>
                <TableHead>{t('settings.users.email')}</TableHead>
                <TableHead>{t('settings.users.role')}</TableHead>
                <TableHead>{t('settings.users.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    {t('loading')}
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    {t('settings.users.noUsers')}
                  </TableCell>
                </TableRow>
              ) : (
                users
                  .filter((user: User) => 
                    !selectedRole || user.role === selectedRole
                  )
                  .map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(`roles.${user.role}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => 
                            handleRoleChange(user.id, value)
                          }
                          disabled={user.role === UserRole.OWNER && users.filter((u: User) => u.role === UserRole.OWNER).length === 1}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value={UserRole.OWNER}>
                                {t('roles.owner')}
                              </SelectItem>
                              <SelectItem value={UserRole.ADMIN}>
                                {t('roles.admin')}
                              </SelectItem>
                              <SelectItem value={UserRole.TRAINER}>
                                {t('roles.trainer')}
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// Вкладка "Назначение групп"
const GroupAssignmentTab = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isOwner, isAdmin } = usePermissions();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  // Получение пользователей с ролью администратора
  const { data: admins = [], isLoading: isLoadingAdmins } = useQuery<User[]>({
    queryKey: ['/api/users/role/admin'],
    enabled: isOwner, // Загружаем данные только для владельца
  });

  // Получение всех групп
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });

  // Получение групп, назначенных выбранному пользователю
  const { data: userGroups = [], isLoading: isLoadingUserGroups } = useQuery<Group[]>({
    queryKey: ['/api/users', selectedUser, 'groups'],
    enabled: !!selectedUser,
  });

  // Мутация для назначения группы пользователю
  const assignGroupMutation = useMutation({
    mutationFn: async ({ userId, groupId }: { userId: number; groupId: number }) => {
      const response = await apiRequest('POST', '/api/users/assign-group', { userId, groupId });
      return getResponseData(response);
    },
    onSuccess: () => {
      toast({
        title: t('settings.groups.assigned'),
        description: t('settings.groups.assignedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', selectedUser, 'groups'] });
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.groups.assignError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Мутация для удаления группы у пользователя
  const removeGroupMutation = useMutation({
    mutationFn: async ({ userId, groupId }: { userId: number; groupId: number }) => {
      const response = await apiRequest('DELETE', `/api/users/${userId}/groups/${groupId}`);
      return getResponseData(response);
    },
    onSuccess: () => {
      toast({
        title: t('settings.groups.removed'),
        description: t('settings.groups.removedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', selectedUser, 'groups'] });
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.groups.removeError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Проверка, назначена ли группа пользователю
  const isGroupAssigned = (groupId: number) => {
    return (userGroups as any[]).some((group) => group.id === groupId);
  };

  // Обработчик назначения/удаления группы
  const handleGroupToggle = (groupId: number) => {
    if (!selectedUser) return;

    if (isGroupAssigned(groupId)) {
      removeGroupMutation.mutate({ userId: selectedUser, groupId });
    } else {
      assignGroupMutation.mutate({ userId: selectedUser, groupId });
    }
  };

  if (!isOwner) {
    return (
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>{t('permissions.accessDenied')}</AlertTitle>
        <AlertDescription>
          {t('permissions.ownerRoleRequired')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.groups.assignTitle')}</CardTitle>
        <CardDescription>{t('settings.groups.assignDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select
            value={selectedUser?.toString() || ''}
            onValueChange={(value) => setSelectedUser(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder={t('settings.groups.selectAdmin')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {isLoadingAdmins ? (
                  <SelectItem value="" disabled>
                    {t('loading')}
                  </SelectItem>
                ) : (
                  admins.map((admin: User) => (
                    <SelectItem key={admin.id} value={admin.id.toString()}>
                      {admin.username}
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {selectedUser && (
          <div className="rounded-md border mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('settings.groups.name')}</TableHead>
                  <TableHead>{t('settings.groups.trainer')}</TableHead>
                  <TableHead>{t('settings.groups.access')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingGroups || isLoadingUserGroups ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      {t('loading')}
                    </TableCell>
                  </TableRow>
                ) : groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      {t('settings.groups.noGroups')}
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group: any) => (
                    <TableRow key={group.id}>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>{group.trainerName || t('settings.groups.noTrainer')}</TableCell>
                      <TableCell>
                        <Button
                          variant={isGroupAssigned(group.id) ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleGroupToggle(group.id)}
                        >
                          {isGroupAssigned(group.id)
                            ? t('settings.groups.remove')
                            : t('settings.groups.assign')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Основная страница управления правами доступа
const UserPermissionsPage = () => {
  const { t } = useTranslation();
  const { isOwner } = usePermissions();

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
      <h1 className="text-2xl font-bold mb-4">{t('settings.permissions.title')}</h1>
      <p className="text-gray-500 mb-6">{t('settings.permissions.description')}</p>

      <Separator className="my-6" />

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">{t('settings.permissions.usersTab')}</TabsTrigger>
          <TabsTrigger value="groups">{t('settings.permissions.groupsTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagementTab />
        </TabsContent>
        <TabsContent value="groups">
          <GroupAssignmentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserPermissionsPage;