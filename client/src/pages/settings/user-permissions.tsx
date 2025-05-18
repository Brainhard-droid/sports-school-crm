import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, getResponseData } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { User, UserRole } from '@shared/schema';

// Импорт компонентов
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

// Упрощенная страница управления правами доступа
const UserPermissionsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isOwner } = usePermissions();
  
  console.log("UserPermissionsPage: isOwner =", isOwner);

  // Получение всех пользователей
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isOwner, // Загружаем данные только для владельца
  });
  
  console.log("UserPermissionsPage: users =", users);

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
      console.error("Error updating role:", error);
      toast({
        title: t('settings.users.roleUpdateError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Обработчик изменения роли
  const handleRoleChange = (userId: number, newRole: string) => {
    console.log(`Changing role for user ${userId} to ${newRole}`);
    updateRoleMutation.mutate({ userId, role: newRole });
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
      <h1 className="text-2xl font-bold mb-4">{t('settings.permissions.title')}</h1>
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