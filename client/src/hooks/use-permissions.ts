import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@shared/schema';

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

/**
 * Хук для проверки прав доступа пользователя
 * Следует принципу единственной ответственности (SRP) из SOLID
 */
export function usePermissions() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  // Проверка роли пользователя
  const isOwner = !!user && user.role === UserRole.OWNER;
  const isAdmin = !!user && (user.role === UserRole.ADMIN || user.role === UserRole.OWNER);
  const isTrainer = !!user && (user.role === UserRole.TRAINER || user.role === UserRole.ADMIN || user.role === UserRole.OWNER);
  
  // Добавляем логирование для отладки
  console.log("usePermissions:", { 
    user, 
    isAuthenticated, 
    isOwner, 
    isAdmin, 
    isTrainer
  });
  
  /**
   * Проверяет наличие доступа к действию
   * @param requiredRole Минимальная требуемая роль
   * @returns true, если у пользователя есть права
   */
  const hasRoleAccess = (requiredRole: UserRoleType): boolean => {
    if (!isAuthenticated || !user) return false;
    
    switch (requiredRole) {
      case UserRole.OWNER:
        return isOwner;
      case UserRole.ADMIN:
        return isAdmin;
      case UserRole.TRAINER:
        return isTrainer;
      default:
        return false;
    }
  };
  
  /**
   * Проверяет, есть ли у пользователя доступ к группе
   * Владелец имеет доступ ко всем группам
   * Админ имеет доступ к назначенным группам
   * Тренер имеет доступ только к своим группам
   * @param groupId ID группы или список ID групп
   * @param trainerUserId ID тренера группы (опционально)
   * @returns true, если у пользователя есть доступ к группе
   */
  const hasGroupAccess = (groupId: number | number[], trainerUserId?: number): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Владелец имеет доступ ко всем группам
    if (isOwner) return true;
    
    // Если передан ID тренера и текущий пользователь тренер, 
    // проверяем, является ли пользователь тренером группы
    if (trainerUserId !== undefined && user.id === trainerUserId) {
      return true;
    }
    
    // В будущем здесь будет проверка доступа к конкретным группам
    // через запрос к API или использование локальных данных о назначенных группах
    
    // Пока возвращаем доступ только для владельцев и админов
    return isAdmin;
  };
  
  return {
    isOwner,
    isAdmin,
    isTrainer,
    hasRoleAccess,
    hasGroupAccess
  };
}