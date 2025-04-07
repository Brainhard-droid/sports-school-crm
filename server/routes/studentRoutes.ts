import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { asyncHandler, ApiErrorClass } from '../middleware/error';
import { insertStudentSchema, insertStudentGroupSchema } from '@shared/schema';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Использовать middleware аутентификации для всех маршрутов
router.use(requireAuth);

// Получение всех студентов
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // Опциональный параметр для фильтрации по статусу активности
  const active = req.query.active 
    ? req.query.active === 'true' 
    : undefined;
  
  const students = await storage.getAllStudents(active);
  
  // Обогащаем данные о студентах информацией о группах
  const enrichedStudents = await Promise.all(
    students.map(async (student) => {
      // Получаем группы для этого студента
      const studentGroups = await storage.getStudentGroups(student.id);
      
      // Получаем детали каждой группы
      const groups = await Promise.all(
        studentGroups.map(async (sg) => {
          const group = await storage.getGroup(sg.groupId);
          return group;
        })
      );
      
      // Фильтруем undefined значения (случай, если группа была удалена)
      const validGroups = groups.filter(Boolean);
      
      // Возвращаем студента с полем groups
      return {
        ...student,
        groups: validGroups
      };
    })
  );
  
  res.json(enrichedStudents);
}));

// Получение студента по ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    id: z.string().transform((val) => parseInt(val, 10))
  });
  
  const { id } = schema.parse(req.params);
  
  const student = await storage.getStudentById(id);
  
  if (!student) {
    throw new ApiErrorClass('Студент не найден', 404);
  }
  
  // Получаем группы для этого студента
  const studentGroups = await storage.getStudentGroups(student.id);
  
  // Получаем детали каждой группы
  const groups = await Promise.all(
    studentGroups.map(async (sg) => {
      const group = await storage.getGroup(sg.groupId);
      return group;
    })
  );
  
  // Фильтруем undefined значения
  const validGroups = groups.filter(Boolean);
  
  // Возвращаем студента с полем groups
  res.json({
    ...student,
    groups: validGroups
  });
}));

// Создание нового студента
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const studentData = insertStudentSchema.parse(req.body);
  
  const newStudent = await storage.createStudent(studentData);
  res.status(201).json(newStudent);
}));

// Обновление студента
router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const idSchema = z.object({
    id: z.string().transform((val) => parseInt(val, 10))
  });
  
  const { id } = idSchema.parse(req.params);
  
  // Используем partial schema для валидации только предоставленных полей
  const updateSchema = insertStudentSchema.partial();
  const updateData = updateSchema.parse(req.body);
  
  const updatedStudent = await storage.updateStudent(id, updateData);
  
  if (!updatedStudent) {
    throw new ApiErrorClass('Студент не найден', 404);
  }
  
  res.json(updatedStudent);
}));

// Удаление студента (мягкое - просто помечаем неактивным)
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    id: z.string().transform((val) => parseInt(val, 10))
  });
  
  const { id } = schema.parse(req.params);
  
  const success = await storage.deleteStudent(id);
  
  if (!success) {
    throw new ApiErrorClass('Студент не найден', 404);
  }
  
  res.status(200).json({ success: true });
}));

// Изменение статуса студента (активный/архивный)
router.patch('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const idSchema = z.object({
    id: z.string().transform((val) => parseInt(val, 10))
  });
  
  const bodySchema = z.object({
    active: z.boolean()
  });
  
  const { id } = idSchema.parse(req.params);
  const { active } = bodySchema.parse(req.body);
  
  const student = await storage.getStudentById(id);
  
  if (!student) {
    throw new ApiErrorClass('Студент не найден', 404);
  }
  
  const updatedStudent = await storage.updateStudent(id, { active });
  
  if (!updatedStudent) {
    throw new ApiErrorClass('Не удалось обновить статус студента', 500);
  }
  
  res.json(updatedStudent);
}));

// Добавление студента в группу
router.post('/student-groups', asyncHandler(async (req: Request, res: Response) => {
  const data = insertStudentGroupSchema.parse(req.body);
  
  // Проверяем существование студента
  const student = await storage.getStudentById(data.studentId);
  if (!student) {
    throw new ApiErrorClass('Студент не найден', 404);
  }
  
  // Проверяем существование группы
  const group = await storage.getGroup(data.groupId);
  if (!group) {
    throw new ApiErrorClass('Группа не найдена', 404);
  }
  
  // Проверяем, возможно студент уже в этой группе
  const existingStudentGroup = await storage.getStudentGroupByIds(data.studentId, data.groupId);
  
  if (existingStudentGroup) {
    // Если связь существует, но не активна - активируем её
    if (!existingStudentGroup.active) {
      const updatedStudentGroup = await storage.updateStudentGroup(
        existingStudentGroup.id, 
        { active: true }
      );
      return res.json(updatedStudentGroup);
    }
    
    // Если связь уже активна, возвращаем ошибку
    throw new ApiErrorClass('Студент уже добавлен в эту группу', 400);
  }
  
  // Создаем новую связь
  const newStudentGroup = await storage.createStudentGroup(data);
  res.status(201).json(newStudentGroup);
}));

export default router;