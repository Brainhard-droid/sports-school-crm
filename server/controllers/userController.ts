import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { hashPassword } from '../auth';
import { asyncHandler, ApiErrorClass } from '../middleware/error';

/**
 * Получение информации о текущем пользователе
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Требуется аутентификация' } });
  }
  res.json(req.user);
});

/**
 * Вход в систему
 */
export const login = (req: Request, res: Response, next: NextFunction) => {
  console.log('Login request received:', req.body.username);
  // Аутентификация будет обрабатываться Passport middleware
  res.json(req.user);
};

/**
 * Регистрация нового пользователя
 */
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { username, password, email } = req.body;

  // Проверяем, существует ли пользователь с таким именем
  const existingUser = await storage.getUserByUsername(username);
  if (existingUser) {
    throw new ApiErrorClass('Пользователь с таким именем уже существует', 400);
  }

  // Проверяем, существует ли пользователь с таким email
  const existingEmail = await storage.getUserByEmail(email);
  if (existingEmail) {
    throw new ApiErrorClass('Пользователь с таким email уже существует', 400);
  }

  // Хешируем пароль
  const hashedPassword = await hashPassword(password);

  // Создаем пользователя
  const user = await storage.createUser({
    username,
    password: hashedPassword,
    role: 'admin', // Пока все пользователи создаются с ролью admin
    email
  });

  // Автоматически входим после регистрации
  req.login(user, (err) => {
    if (err) {
      return next(err);
    }
    console.log('Registration and auto-login successful for user:', user.id);
    res.status(201).json(user);
  });
});

/**
 * Выход из системы
 */
export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    console.log('Logout successful');
    res.sendStatus(200);
  });
});

/**
 * Запрос на сброс пароля
 */
export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await storage.getUserByEmail(email);
  if (!user) {
    throw new ApiErrorClass('Пользователь с таким email не найден', 404);
  }

  // Генерируем и сохраняем токен для сброса
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Устанавливаем срок действия токена (1 час)
  const now = new Date();
  const resetTokenExpiry = new Date(now.getTime() + 60 * 60 * 1000);

  // Обновляем пользователя с токеном
  await storage.updateUser(user.id, {
    resetToken,
    resetTokenExpiry
  });

  // Отправляем email со ссылкой для сброса
  try {
    const { sendPasswordResetEmail } = require('../services/email');
    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'Инструкции по сбросу пароля отправлены на ваш email' });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new ApiErrorClass('Не удалось отправить email для сброса пароля', 500);
  }
});

/**
 * Сброс пароля
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  // Проверяем токен
  const user = await storage.getUserByResetToken(token);
  if (!user) {
    throw new ApiErrorClass('Недействительный или истекший токен сброса пароля', 400);
  }

  // Проверяем срок действия токена
  const now = new Date();
  if (!user.resetTokenExpiry || now > user.resetTokenExpiry) {
    throw new ApiErrorClass('Срок действия токена истек', 400);
  }

  // Хешируем новый пароль и обновляем пользователя
  const hashedPassword = await hashPassword(password);
  await storage.updateUser(user.id, {
    password: hashedPassword,
    resetToken: null,
    resetTokenExpiry: null
  });

  res.json({ message: 'Пароль успешно изменен' });
});

/**
 * Обновление профиля пользователя
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    throw new ApiErrorClass('Требуется аутентификация', 401);
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new ApiErrorClass('ID пользователя не найден', 400);
  }

  // Получаем поля для обновления (кроме пароля, роли и токенов)
  const { username, email } = req.body;

  // Создаем объект для обновления
  const updateData: Partial<typeof req.user> = {};

  if (username) {
    // Проверяем, не занято ли это имя пользователя
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser && existingUser.id !== userId) {
      throw new ApiErrorClass('Пользователь с таким именем уже существует', 400);
    }
    updateData.username = username;
  }

  if (email) {
    // Проверяем, не занят ли этот email
    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail && existingEmail.id !== userId) {
      throw new ApiErrorClass('Пользователь с таким email уже существует', 400);
    }
    updateData.email = email;
  }

  // Если обновляемых полей нет, возвращаем текущего пользователя
  if (Object.keys(updateData).length === 0) {
    return res.json(req.user);
  }

  // Обновляем пользователя
  const updatedUser = await storage.updateUser(userId, updateData);
  res.json(updatedUser);
});

/**
 * Изменение пароля
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    throw new ApiErrorClass('Требуется аутентификация', 401);
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new ApiErrorClass('ID пользователя не найден', 400);
  }

  const { currentPassword, newPassword } = req.body;

  // Проверяем текущий пароль
  const user = await storage.getUser(userId);
  if (!user) {
    throw new ApiErrorClass('Пользователь не найден', 404);
  }

  const { comparePasswords } = require('../auth');
  const isValid = await comparePasswords(currentPassword, user.password);
  if (!isValid) {
    throw new ApiErrorClass('Текущий пароль неверен', 400);
  }

  // Хешируем новый пароль
  const hashedPassword = await hashPassword(newPassword);

  // Обновляем пароль
  await storage.updateUser(userId, { password: hashedPassword });

  res.json({ message: 'Пароль успешно изменен' });
});