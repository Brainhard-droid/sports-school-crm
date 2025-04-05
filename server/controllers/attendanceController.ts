import { Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler, ApiErrorClass } from '../middleware/error';

// Заглушки для контроллеров посещаемости, которые будут реализованы позже
export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const groupId = parseInt(req.query.groupId as string);
  const dateStr = req.query.date as string;
  
  if (!groupId || !dateStr) {
    throw new ApiErrorClass('Требуются параметры groupId и date', 400);
  }
  
  const date = new Date(dateStr);
  const attendance = await storage.getAttendance(groupId, date);
  
  res.json(attendance);
});