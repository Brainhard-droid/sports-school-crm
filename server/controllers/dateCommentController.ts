import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertDateCommentSchema } from '@shared/schema';
import { z } from 'zod';

/**
 * Получает комментарии к датам для группы за указанный месяц
 */
export const getDateComments = async (req: Request, res: Response) => {
  try {
    // Проверяем наличие параметров запроса
    const schema = z.object({
      groupId: z.coerce.number(),
      month: z.coerce.number().min(1).max(12),
      year: z.coerce.number()
    });
    
    const validatedParams = schema.safeParse(req.query);
    
    if (!validatedParams.success) {
      return res.status(400).json({ 
        error: 'Неверные параметры запроса', 
        details: validatedParams.error.format() 
      });
    }
    
    const { groupId, month, year } = validatedParams.data;
    
    // Получаем комментарии к датам
    const comments = await storage.getDateComments(groupId, month, year);
    
    res.json(comments);
  } catch (error) {
    console.error('Error in getDateComments:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

/**
 * Создает новый комментарий к дате
 */
export const createDateComment = async (req: Request, res: Response) => {
  try {
    // Валидируем данные из тела запроса
    const validatedBody = insertDateCommentSchema.safeParse(req.body);
    
    if (!validatedBody.success) {
      return res.status(400).json({ 
        error: 'Неверные данные для создания комментария', 
        details: validatedBody.error.format() 
      });
    }
    
    // Создаем комментарий
    const comment = await storage.createDateComment(validatedBody.data);
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error in createDateComment:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

/**
 * Обновляет существующий комментарий к дате
 */
export const updateDateComment = async (req: Request, res: Response) => {
  try {
    // Получаем ID комментария из параметров маршрута
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Неверный ID комментария' });
    }
    
    // Валидируем данные из тела запроса
    const schema = z.object({
      comment: z.string().min(1)
    });
    
    const validatedBody = schema.safeParse(req.body);
    
    if (!validatedBody.success) {
      return res.status(400).json({ 
        error: 'Неверные данные для обновления комментария', 
        details: validatedBody.error.format() 
      });
    }
    
    // Проверяем, существует ли комментарий с указанным ID
    const existingComment = await storage.getDateCommentById(id);
    
    if (!existingComment) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }
    
    // Обновляем комментарий
    const updatedComment = await storage.updateDateComment(id, validatedBody.data.comment);
    
    res.json(updatedComment);
  } catch (error) {
    console.error('Error in updateDateComment:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

/**
 * Удаляет комментарий к дате
 */
export const deleteDateComment = async (req: Request, res: Response) => {
  try {
    // Получаем ID комментария из параметров маршрута
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Неверный ID комментария' });
    }
    
    // Проверяем, существует ли комментарий с указанным ID
    const existingComment = await storage.getDateCommentById(id);
    
    if (!existingComment) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }
    
    // Удаляем комментарий
    const result = await storage.deleteDateComment(id);
    
    if (result) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: 'Не удалось удалить комментарий' });
    }
  } catch (error) {
    console.error('Error in deleteDateComment:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};