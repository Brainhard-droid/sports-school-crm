import { Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler, ApiErrorClass } from '../middleware/error';
import { insertAttendanceSchema, AttendanceStatus } from '@shared/schema';
import { format } from 'date-fns';

// Контроллеры для работы с посещаемостью
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

// Получение посещаемости за месяц
export const getAttendanceByMonth = asyncHandler(async (req: Request, res: Response) => {
  const groupId = parseInt(req.query.groupId as string);
  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);
  
  if (!groupId || isNaN(month) || isNaN(year)) {
    throw new ApiErrorClass('Требуются корректные параметры groupId, month и year', 400);
  }
  
  console.log(`Fetching attendance for group ${groupId} month ${month} year ${year}`);
  
  const attendanceData = await storage.getAttendanceByMonth(groupId, month, year);
  
  res.json(attendanceData);
});

// Создание новой записи о посещаемости
export const createAttendance = asyncHandler(async (req: Request, res: Response) => {
  // Валидация входных данных
  const validationResult = insertAttendanceSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new ApiErrorClass('Некорректные данные посещаемости', 400);
  }
  
  const { studentId, groupId, date, status } = req.body;
  
  // Проверка, что дата корректная и содержит время
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new ApiErrorClass('Некорректная дата', 400);
  }
  
  // Форматируем дату только до дня (без времени)
  const formattedDate = format(parsedDate, 'yyyy-MM-dd');
  
  console.log(`Creating attendance record: { studentId: ${studentId}, groupId: ${groupId}, date: '${formattedDate}', status: ${status} }`);
  
  // Создаём запись о посещаемости
  const attendance = await storage.createAttendance({
    studentId,
    groupId,
    date: formattedDate,
    status
  });
  
  res.status(201).json(attendance);
});

// Обновление существующей записи о посещаемости
export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new ApiErrorClass('Некорректный ID записи', 400);
  }
  
  // Проверяем, что запись существует
  const attendanceRecord = await storage.getAttendanceById(id);
  if (!attendanceRecord) {
    throw new ApiErrorClass('Запись о посещаемости не найдена', 404);
  }
  
  // Проверяем переданный статус
  const { status } = req.body;
  if (!status || !(status in AttendanceStatus)) {
    throw new ApiErrorClass('Некорректный статус посещаемости', 400);
  }
  
  // Обновляем запись
  const updatedAttendance = await storage.updateAttendance(id, { status });
  
  res.json(updatedAttendance);
});

// Массовое обновление посещаемости для всех студентов группы на определенную дату
export const bulkUpdateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { groupId, date, status } = req.body;
  
  if (!groupId || !date || !status) {
    throw new ApiErrorClass('Отсутствуют обязательные параметры', 400);
  }
  
  // Проверяем, что статус валидный
  if (!(status in AttendanceStatus)) {
    throw new ApiErrorClass('Некорректный статус посещаемости', 400);
  }
  
  // Получаем список студентов в группе
  const students = await storage.getGroupStudentsWithDetails(groupId);
  if (!students || students.length === 0) {
    throw new ApiErrorClass('В группе нет студентов', 404);
  }
  
  // Создаем или обновляем записи о посещаемости для каждого студента
  const updatedAttendance = await Promise.all(
    students.map(async (student) => {
      return await storage.createAttendance({
        studentId: student.id,
        groupId,
        date,
        status
      });
    })
  );
  
  res.status(200).json(updatedAttendance);
});