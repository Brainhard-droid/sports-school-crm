import { Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler, ApiErrorClass } from '../middleware/error';
import { UserRole } from '@shared/schema';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { users, userGroups } from '@shared/schema';
import { db } from '../db';
import { sendUserCredentialsEmail } from '../services/email';
import { hashPassword } from '../auth';

// Функция для генерации случайного пароля
const generatePassword = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Схемы валидации
const updateRoleSchema = z.object({
  role: z.enum([UserRole.OWNER, UserRole.ADMIN, UserRole.TRAINER])
});

const assignGroupSchema = z.object({
  userId: z.number().int().positive(),
  groupId: z.number().int().positive()
});

const createUserSchema = z.object({
  email: z.string().email('Введите корректный email адрес'),
  role: z.enum([UserRole.OWNER, UserRole.ADMIN, UserRole.TRAINER]).default(UserRole.TRAINER)
});

/**
 * Контроллер для управления пользователями и их правами
 * Соответствует принципу единственной ответственности (SRP) из SOLID
 */
export class UserController {
  /**
   * Схемы валидации для повторного использования
   */
  static validationSchemas = {
    updateRole: updateRoleSchema,
    assignGroup: assignGroupSchema,
    createUser: createUserSchema,
    params: z.object({
      id: z.string().transform((val) => parseInt(val))
    })
  };

  /**
   * Получение всех пользователей системы
   */
  static getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    // Получаем всех пользователей (без чувствительных данных)
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      role: users.role,
      email: users.email
    }).from(users);
    
    res.json(allUsers);
  });

  /**
   * Получение пользователей с определенной ролью
   */
  static getUsersByRole = asyncHandler(async (req: Request, res: Response) => {
    const { role } = req.params;
    
    // Проверяем, что роль валидна
    if (!Object.values(UserRole).includes(role as any)) {
      throw new ApiErrorClass('Неверная роль', 400);
    }
    
    // Получаем пользователей с указанной ролью
    const filteredUsers = await db.select({
      id: users.id,
      username: users.username,
      role: users.role,
      email: users.email
    })
    .from(users)
    .where(eq(users.role, role));
    
    res.json(filteredUsers);
  });

  /**
   * Обновление роли пользователя
   */
  static updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    
    // Проверяем, существует ли пользователь
    const user = await storage.getUser(userId);
    if (!user) {
      throw new ApiErrorClass('Пользователь не найден', 404);
    }
    
    // Проверяем, что текущий пользователь не меняет свою роль (для избежания случая, когда владелец лишает себя прав)
    if (req.user && req.user.id === userId && req.user.role === UserRole.OWNER && role !== UserRole.OWNER) {
      throw new ApiErrorClass('Нельзя понизить собственную роль владельца', 403);
    }
    
    // Обновляем роль пользователя
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    
    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      email: updatedUser.email
    });
  });

  /**
   * Назначение группы пользователю (для администраторов)
   */
  static assignGroupToUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId, groupId } = req.body;
    
    // Проверяем, существует ли пользователь
    const user = await storage.getUser(userId);
    if (!user) {
      throw new ApiErrorClass('Пользователь не найден', 404);
    }
    
    // Проверяем, существует ли группа
    const group = await storage.getGroup(groupId);
    if (!group) {
      throw new ApiErrorClass('Группа не найдена', 404);
    }
    
    // Проверяем, есть ли уже такая связь
    const existingRelation = await db
      .select()
      .from(userGroups)
      .where(
        and(
          eq(userGroups.userId, userId),
          eq(userGroups.groupId, groupId)
        )
      );
    
    if (existingRelation.length > 0) {
      return res.json(existingRelation[0]);
    }
    
    // Создаем новую связь
    const [newRelation] = await db
      .insert(userGroups)
      .values({
        userId,
        groupId
      })
      .returning();
    
    res.status(201).json(newRelation);
  });

  /**
   * Удаление группы у пользователя
   */
  static removeGroupFromUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const groupId = parseInt(req.params.groupId);
    
    // Проверяем, существует ли пользователь
    const user = await storage.getUser(userId);
    if (!user) {
      throw new ApiErrorClass('Пользователь не найден', 404);
    }
    
    // Проверяем, существует ли группа
    const group = await storage.getGroup(groupId);
    if (!group) {
      throw new ApiErrorClass('Группа не найдена', 404);
    }
    
    // Удаляем связь
    const deleted = await db
      .delete(userGroups)
      .where(
        and(
          eq(userGroups.userId, userId),
          eq(userGroups.groupId, groupId)
        )
      )
      .returning();
    
    if (deleted.length === 0) {
      throw new ApiErrorClass('Связь не найдена', 404);
    }
    
    res.json({ success: true, message: 'Группа успешно отвязана от пользователя' });
  });

  /**
   * Получение групп, доступных пользователю
   */
  static getUserGroups = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    
    // Проверяем, существует ли пользователь
    const user = await storage.getUser(userId);
    if (!user) {
      throw new ApiErrorClass('Пользователь не найден', 404);
    }
    
    // Если пользователь владелец, получаем все группы
    if (user.role === UserRole.OWNER) {
      const allGroups = await storage.getGroups();
      return res.json(allGroups);
    }
    
    // Для администратора получаем назначенные группы
    if (user.role === UserRole.ADMIN) {
      // Получаем связи пользователя с группами
      const userGroupRelations = await db
        .select()
        .from(userGroups)
        .where(eq(userGroups.userId, userId));
      
      // Если нет связей, возвращаем пустой массив
      if (userGroupRelations.length === 0) {
        return res.json([]);
      }
      
      // Получаем группы по их ID
      const groupIds = userGroupRelations.map(relation => relation.groupId);
      const groups = await Promise.all(
        groupIds.map(groupId => storage.getGroup(groupId))
      );
      
      return res.json(groups.filter(Boolean));
    }
    
    // Для тренера получаем только его группы
    if (user.role === UserRole.TRAINER) {
      const trainerGroups = await storage.getGroups();
      const filterGroups = trainerGroups.filter(group => group.trainer === userId);
      return res.json(filterGroups);
    }
    
    // По умолчанию возвращаем пустой массив
    res.json([]);
  });

  /**
   * Создание нового пользователя
   */
  static createUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, role } = req.body;
    
    // Проверяем, существует ли уже пользователь с таким email
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
      
    if (existingUser.length > 0) {
      throw new ApiErrorClass('Пользователь с таким email уже существует', 400);
    }
    
    // Имя пользователя - email без домена
    const username = email.split('@')[0];
    
    // Генерируем случайный пароль
    const plainPassword = generatePassword();
    
    // Хешируем пароль для хранения в БД, используя централизованную функцию
    const hashedPassword = await hashPassword(plainPassword);
    
    // Создаем нового пользователя
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        role,
        password: hashedPassword
      })
      .returning();
    
    // Отправляем email с данными для входа, используя централизованный сервис
    const emailSent = await sendUserCredentialsEmail(email, username, plainPassword);
    
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      emailSent
    });
  });

  /**
   * Удаление пользователя
   */
  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    
    // Проверяем, существует ли пользователь
    const user = await storage.getUser(userId);
    if (!user) {
      throw new ApiErrorClass('Пользователь не найден', 404);
    }
    
    // Проверяем, не пытается ли пользователь удалить сам себя
    if (req.user && req.user.id === userId) {
      throw new ApiErrorClass('Вы не можете удалить собственную учетную запись', 400);
    }
    
    // Если это единственный владелец, запрещаем удаление
    if (user.role === UserRole.OWNER) {
      const owners = await db
        .select()
        .from(users)
        .where(eq(users.role, UserRole.OWNER));
      
      if (owners.length <= 1) {
        throw new ApiErrorClass('Нельзя удалить единственного владельца системы', 400);
      }
    }
    
    // Удаляем пользователя
    await db
      .delete(users)
      .where(eq(users.id, userId));
    
    // Удаляем связи с группами
    await db
      .delete(userGroups)
      .where(eq(userGroups.userId, userId));
    
    res.json({ success: true, message: 'Пользователь успешно удален' });
  });
}