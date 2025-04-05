import { Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler, ApiErrorClass } from '../middleware/error';

// Заглушки для контроллеров групп, которые будут реализованы позже
export const getAllGroups = asyncHandler(async (req: Request, res: Response) => {
  const groups = await storage.getGroups();
  res.json(groups);
});

export const getGroupById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const group = await storage.getGroup(id);
  
  if (!group) {
    throw new ApiErrorClass('Группа не найдена', 404);
  }
  
  res.json(group);
});