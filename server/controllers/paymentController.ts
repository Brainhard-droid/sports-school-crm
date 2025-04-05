import { Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler, ApiErrorClass } from '../middleware/error';

// Заглушки для контроллеров платежей, которые будут реализованы позже
export const getAllPayments = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
  const payments = await storage.getPayments(studentId);
  res.json(payments);
});