import { Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler, ApiErrorClass } from '../middleware/error';

// Заглушки для контроллеров студентов, которые будут реализованы позже
export const getAllStudents = asyncHandler(async (req: Request, res: Response) => {
  const students = await storage.getStudents();
  res.json(students);
});

export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const student = await storage.getStudent(id);
  
  if (!student) {
    throw new ApiErrorClass('Студент не найден', 404);
  }
  
  res.json(student);
});