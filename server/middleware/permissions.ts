import { Request, Response, NextFunction } from 'express';
import { ApiErrorClass } from './error';
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
export const isOwner = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    throw new ApiErrorClass('Требуется авторизация', 401);
  }
  
  if (req.user?.role !== UserRole.OWNER) {
    throw new ApiErrorClass('Доступ запрещен. Требуются права владельца системы', 403);
  }
  
  next();
};

/**
 * Проверяет, является ли пользователь администратором или выше
 */
export const isAdminOrHigher = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    throw new ApiErrorClass('Требуется авторизация', 401);
  }
  
  if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.OWNER) {
    throw new ApiErrorClass('Доступ запрещен. Требуются права администратора', 403);
  }
  
  next();
};

/**
 * Заполняет данные о правах пользователя
 * Если пользователь авторизован, добавляет информацию о ролях и доступных группах
 */
export const populateUserPermissions = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      req.userPermissions = {
        isOwner: false,
        isAdmin: false,
        isTrainer: false,
        assignedGroupIds: []
      };
      return next();
    }
    
    // Определяем роль пользователя
    const isOwner = req.user.role === UserRole.OWNER;
    const isAdmin = req.user.role === UserRole.ADMIN || isOwner;
    const isTrainer = req.user.role === UserRole.TRAINER || isAdmin || isOwner;
    
    // Получаем ID групп, к которым у пользователя есть доступ
    const assignedGroupIds: number[] = [];
    
    if (isOwner) {
      // Владелец имеет доступ ко всем группам
      const allGroups = await storage.getAllGroups();
      assignedGroupIds.push(...allGroups.map(group => group.id));
    } else if (isAdmin) {
      // Администратор имеет доступ к назначенным группам
      const adminGroups = await storage.getGroupsByUserId(req.user.id);
      assignedGroupIds.push(...adminGroups.map(group => group.id));
    } else if (isTrainer) {
      // Тренер имеет доступ только к своим группам
      const trainerGroups = await storage.getGroupsByTrainerId(req.user.id);
      assignedGroupIds.push(...trainerGroups.map(group => group.id));
    }
    
    // Добавляем информацию о правах в request
    req.userPermissions = {
      isOwner,
      isAdmin,
      isTrainer,
      assignedGroupIds
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Проверяет наличие доступа к группе
 * @param groupId ID группы, доступ к которой проверяется
 * @returns Middleware для проверки доступа к конкретной группе
 */
export const hasGroupAccess = (groupId: number) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        throw new ApiErrorClass('Требуется авторизация', 401);
      }
      
      // Если права еще не заполнены, заполняем их
      if (!req.userPermissions) {
        await populateUserPermissions(req, _res, () => {});
      }
      
      // Владелец имеет доступ ко всем группам
      if (req.userPermissions?.isOwner) {
        return next();
      }
      
      // Проверяем наличие группы в списке доступных
      if (!req.userPermissions?.assignedGroupIds.includes(groupId)) {
        throw new ApiErrorClass('Доступ к данной группе запрещен', 403);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Проверяет наличие доступа к ученику
 * @param studentId ID ученика, доступ к которому проверяется
 * @returns Middleware для проверки доступа к конкретному ученику
 */
export const hasStudentAccess = (studentId: number) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        throw new ApiErrorClass('Требуется авторизация', 401);
      }
      
      // Если права еще не заполнены, заполняем их
      if (!req.userPermissions) {
        await populateUserPermissions(req, _res, () => {});
      }
      
      // Владелец имеет доступ ко всем ученикам
      if (req.userPermissions?.isOwner) {
        return next();
      }
      
      // Получаем группы ученика
      const studentGroups = await storage.getGroupsByStudentId(studentId);
      const studentGroupIds = studentGroups.map(group => group.id);
      
      // Проверяем, есть ли у пользователя доступ хотя бы к одной группе ученика
      const hasAccess = studentGroupIds.some(groupId => 
        req.userPermissions?.assignedGroupIds.includes(groupId)
      );
      
      if (!hasAccess) {
        throw new ApiErrorClass('Доступ к данному ученику запрещен', 403);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};