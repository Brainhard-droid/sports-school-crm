import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { UserRole } from '@shared/schema';

/**
 * Интерфейс для расширения Express Request
 * Добавляет информацию о правах пользователя
 */
declare global {
  namespace Express {
    interface Request {
      userPermissions?: {
        isOwner: boolean;
        isAdmin: boolean;
        isTrainer: boolean;
        assignedGroupIds: number[];
      };
    }
  }
}

/**
 * Проверяет, является ли пользователь владельцем системы
 */
export const isOwner = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Требуется аутентификация' });
  }
  
  if (req.user.role !== UserRole.OWNER) {
    return res.status(403).json({ message: 'Нет доступа. Требуются права владельца' });
  }
  
  next();
};

/**
 * Проверяет, является ли пользователь администратором или выше
 */
export const isAdminOrHigher = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Требуется аутентификация' });
  }
  
  if (req.user.role !== UserRole.OWNER && req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Нет доступа. Требуются права администратора' });
  }
  
  next();
};

/**
 * Проверяет, является ли пользователь тренером или выше
 */
export const isTrainerOrHigher = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Требуется аутентификация' });
  }
  
  // Все роли имеют доступ тренера или выше
  next();
};

/**
 * Заполняет данные о правах пользователя
 * Если пользователь авторизован, добавляет информацию о ролях и доступных группах
 */
export const populateUserPermissions = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    req.userPermissions = {
      isOwner: false,
      isAdmin: false,
      isTrainer: false,
      assignedGroupIds: []
    };
    return next();
  }
  
  try {
    const isOwner = req.user.role === UserRole.OWNER;
    const isAdmin = isOwner || req.user.role === UserRole.ADMIN;
    const isTrainer = isAdmin || req.user.role === UserRole.TRAINER;
    
    // Получаем ID групп, к которым у пользователя есть доступ
    let assignedGroupIds: number[] = [];
    
    if (isOwner) {
      // Владелец имеет доступ ко всем группам
      const allGroups = await storage.getGroups();
      assignedGroupIds = allGroups.map(group => group.id);
    } else if (isAdmin) {
      // Админ имеет доступ к назначенным группам
      // Здесь нужно будет заменить на корректный метод, когда он будет доступен
      const adminGroups = await storage.getGroups();
      assignedGroupIds = adminGroups.map(group => group.id);
    } else if (isTrainer) {
      // Тренер имеет доступ только к своим группам
      const allGroups = await storage.getGroups();
      // Проверяем, что req.user существует
      if (req.user && req.user.id) {
        const trainerGroups = allGroups.filter(group => group.trainer === req.user!.id);
        assignedGroupIds = trainerGroups.map(group => group.id);
      }
    }
    
    req.userPermissions = {
      isOwner,
      isAdmin,
      isTrainer,
      assignedGroupIds
    };
    
    next();
  } catch (error) {
    console.error('Ошибка при получении прав пользователя:', error);
    req.userPermissions = {
      isOwner: false,
      isAdmin: false,
      isTrainer: false,
      assignedGroupIds: []
    };
    next();
  }
};

/**
 * Проверяет наличие доступа к группе
 * @param groupId ID группы, доступ к которой проверяется
 * @returns Middleware для проверки доступа к конкретной группе
 */
export const hasGroupAccess = (groupId: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Требуется аутентификация' });
    }
    
    try {
      // Проверяем роль пользователя
      const isOwner = req.user.role === UserRole.OWNER;
      
      // Владелец имеет доступ ко всем группам
      if (isOwner) {
        return next();
      }
      
      // Получаем информацию о группе
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Группа не найдена' });
      }
      
      // Если пользователь - тренер группы, даем доступ
      if (group.trainer === req.user.id) {
        return next();
      }
      
      // Если пользователь - администратор, проверяем назначенные группы
      if (req.user.role === UserRole.ADMIN) {
        // В будущем здесь будет проверка назначенных администратору групп
        // Пока просто даем доступ всем администраторам
        return next();
      }
      
      // В других случаях доступ запрещен
      return res.status(403).json({ message: 'Нет доступа к данной группе' });
    } catch (error) {
      console.error('Ошибка при проверке доступа к группе:', error);
      return res.status(500).json({ message: 'Ошибка сервера при проверке прав доступа' });
    }
  };
};

/**
 * Проверяет наличие доступа к ученику
 * @param studentId ID ученика, доступ к которому проверяется
 * @returns Middleware для проверки доступа к конкретному ученику
 */
export const hasStudentAccess = (studentId: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Требуется аутентификация' });
    }
    
    try {
      // Проверяем роль пользователя
      const isOwner = req.user.role === UserRole.OWNER;
      
      // Владелец имеет доступ ко всем ученикам
      if (isOwner) {
        return next();
      }
      
      // Получаем группы ученика
      const studentGroups = await storage.getStudentGroups(studentId);
      if (studentGroups.length === 0) {
        // Если ученик не состоит в группах, доступ только для владельцев и админов
        if (req.user.role === UserRole.ADMIN) {
          return next();
        }
        return res.status(403).json({ message: 'Нет доступа к данному ученику' });
      }
      
      // Проверяем, есть ли у пользователя доступ хотя бы к одной группе ученика
      for (const studentGroup of studentGroups) {
        const groupId = studentGroup.groupId;
        const group = await storage.getGroup(groupId);
        
        // Если пользователь - тренер группы, даем доступ
        if (group && group.trainer === req.user.id) {
          return next();
        }
        
        // Если пользователь - администратор, проверяем назначенные группы
        if (req.user.role === UserRole.ADMIN) {
          // В будущем здесь будет проверка назначенных администратору групп
          // Пока просто даем доступ всем администраторам
          return next();
        }
      }
      
      // В других случаях доступ запрещен
      return res.status(403).json({ message: 'Нет доступа к данному ученику' });
    } catch (error) {
      console.error('Ошибка при проверке доступа к ученику:', error);
      return res.status(500).json({ message: 'Ошибка сервера при проверке прав доступа' });
    }
  };
};