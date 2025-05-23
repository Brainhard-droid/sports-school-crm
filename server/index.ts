import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import cookieParser from "cookie-parser";
import session from "express-session";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { errorHandler } from "./middleware/error";
import { registerRoutes } from "./routes";
import apiRoutes from "./routes/index";

import { db } from './db';
import { 
  sportsSections, 
  branches, 
  branchSections, 
  trialRequests,
  TrialRequestStatus,
  students,
  groups,
  schedules,
  payments,
  attendance
} from "@shared/schema";
import { eq, and } from 'drizzle-orm';
import { generateScheduleDates } from './utils/schedule';

// Временные маршруты, которые будут перемещены в соответствующие модули
// Примечание: эндпоинты для студентов теперь обрабатываются через Router (/api/students)

// Эндпоинт для групп
apiRoutes.get("/groups", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const allGroups = await db.select().from(groups);
    
    // Получаем количество студентов для каждой группы
    const enrichedGroups = await Promise.all(
      allGroups.map(async (group) => {
        const studentGroups = await storage.getGroupStudents(group.id);
        // Подсчитываем только активных студентов в группе
        const activeStudentGroups = studentGroups.filter(sg => sg.active);
        return {
          ...group,
          currentStudents: activeStudentGroups.length
        };
      })
    );
    
    res.json(enrichedGroups);
  } catch (error) {
    console.error('Error getting groups:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Эндпоинт для получения группы по ID
apiRoutes.get("/groups/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    
    // Получаем студентов в этой группе
    const studentGroups = await storage.getGroupStudents(id);
    const activeStudentGroups = studentGroups.filter(sg => sg.active);
    
    // Получаем детальную информацию о студентах
    const students = await storage.getGroupStudentsWithDetails(id);
    
    // Возвращаем группу с дополнительными данными
    res.json({
      ...group,
      currentStudents: activeStudentGroups.length,
      students
    });
  } catch (error) {
    console.error('Error getting group details:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Эндпоинт для получения расписания (всех или конкретной группы)
apiRoutes.get("/schedules", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const groupId = req.query.groupId ? parseInt(req.query.groupId as string) : undefined;
    
    let result;
    if (groupId) {
      // Если указан ID группы, возвращаем только расписание этой группы
      console.log(`Getting schedules for group ID: ${groupId}`);
      result = await db
        .select()
        .from(schedules)
        .where(eq(schedules.groupId, groupId));
      console.log(`Found ${result.length} schedule entries`);
    } else {
      // Иначе возвращаем все расписания
      console.log('Getting all schedules');
      result = await db.select().from(schedules);
      console.log(`Found ${result.length} total schedule entries`);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Эндпоинт для удаления всех расписаний группы
apiRoutes.delete("/schedules/group/:groupId", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const groupId = parseInt(req.params.groupId);
    
    console.log(`Deleting all schedules for group ID: ${groupId}`);
    
    // Удаляем все расписания для данной группы
    const result = await db
      .delete(schedules)
      .where(eq(schedules.groupId, groupId))
      .returning();
    
    console.log(`Deleted ${result.length} schedule entries`);
    res.json({ message: `Deleted ${result.length} schedule entries` });
  } catch (error) {
    console.error('Error deleting schedules:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Эндпоинт для создания расписания занятий
apiRoutes.post("/schedules", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { groupId, dayOfWeek, startTime, endTime } = req.body;
    
    console.log('Creating schedule entry:', { groupId, dayOfWeek, startTime, endTime });
    
    // Создаем новое расписание (без проверки на существующие записи)
    const [newSchedule] = await db
      .insert(schedules)
      .values({ groupId, dayOfWeek, startTime, endTime })
      .returning();
    
    console.log('Created new schedule:', newSchedule);
    return res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Эндпоинт для получения дат расписания группы по месяцу и году
apiRoutes.get("/groups/:id/schedule-dates", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const groupId = parseInt(req.params.id);
    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);
    
    console.log('Getting schedule dates for group, month and year:', { groupId, month, year });
    
    if (isNaN(groupId) || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: 'Invalid parameters. Group ID, month and year are required.' });
    }
    
    // Получаем расписание группы
    const groupSchedules = await db
      .select()
      .from(schedules)
      .where(eq(schedules.groupId, groupId));
    
    console.log(`Found ${groupSchedules.length} schedule entries for group ${groupId}`);
    
    if (!groupSchedules.length) {
      return res.json([]);
    }
    
    // Генерируем даты на основе расписания
    const dates = generateScheduleDates(groupSchedules, month, year);
    
    console.log(`Generated ${dates.length} dates for group ${groupId} in month ${month}/${year}`);
    
    // Возвращаем массив дат в ISO формате
    res.json(dates.map(date => date.toISOString()));
  } catch (error) {
    console.error('Error getting schedule dates:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Эндпоинт для платежей
apiRoutes.get("/payments", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Фильтр по студенту, если указан
    const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
    
    let result;
    if (studentId) {
      result = await db.select().from(payments).where(eq(payments.studentId, studentId));
    } else {
      result = await db.select().from(payments);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Эндпоинт для посещаемости
apiRoutes.get("/attendance", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Фильтры по группе и дате
    const groupId = req.query.groupId ? parseInt(req.query.groupId as string) : undefined;
    const date = req.query.date ? new Date(req.query.date as string) : undefined;
    
    let result;
    if (groupId) {
      result = await db.select().from(attendance).where(eq(attendance.groupId, groupId));
    } else {
      result = await db.select().from(attendance);
    }
    
    // Временная заглушка для даты, так как не можем использовать операции сравнения дат напрямую
    // TODO: реализовать фильтрацию по дате корректно
    
    res.json(result);
  } catch (error) {
    console.error('Error getting attendance:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Маршруты для спортивных секций и филиалов
apiRoutes.get("/sports-sections", async (_req, res) => {
  try {
    const sections = await db
      .select()
      .from(sportsSections)
      .where(eq(sportsSections.active, true));
    res.json(sections);
  } catch (error) {
    console.error('Error getting sports sections:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Маршрут для получения филиалов по секции
apiRoutes.get("/branches-by-section", async (req, res) => {
  try {
    const sectionId = parseInt(req.query.sectionId as string);
    if (!sectionId) {
      return res.status(400).json({ error: "Missing sectionId parameter" });
    }

    const results = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        phone: branches.phone,
        active: branches.active,
        branchSectionId: branchSections.id,
        schedule: branchSections.schedule,
      })
      .from(branchSections)
      .innerJoin(branches, eq(branches.id, branchSections.branchId))
      .where(
        and(
          eq(branchSections.sectionId, sectionId),
          eq(branches.active, true),
          eq(branchSections.active, true)
        )
      );

    res.json(results);
  } catch (error) {
    console.error('Error getting branches by section:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Получение всех филиалов
apiRoutes.get("/branches", async (_req, res) => {
  try {
    const allBranches = await db
      .select()
      .from(branches)
      .where(eq(branches.active, true));
    res.json(allBranches);
  } catch (error) {
    console.error('Error getting branches:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Маршрут для обработки заявок на пробное занятие
// ВАЖНО: Этот маршрут закомментирован, так как теперь используется контроллер из modules/trialRequest
/* apiRoutes.post("/trial-requests", async (req, res) => {
  try {
    console.log('OLD HANDLER: Получен запрос на создание пробного занятия, переключитесь на использование контроллеров');
    console.log('Тело запроса:', req.body);
    
    const {
      childName,
      childAge,
      parentName,
      parentPhone,
      sectionId,
      branchId,
      desiredDate,
      notes,
      consentToDataProcessing
    } = req.body;

    // Проверяем согласие на обработку данных
    if (!consentToDataProcessing) {
      return res.status(400).json({ error: 'Необходимо согласие на обработку персональных данных' });
    }

    // Создаем заявку в базе данных
    const [newRequest] = await db
      .insert(trialRequests)
      .values({
        childName,
        childAge,
        parentName,
        parentPhone,
        sectionId,
        branchId,
        desiredDate: new Date(desiredDate),
        status: TrialRequestStatus.NEW,
        notes,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Дополняем информацией о секции и филиале
    const [section] = await db
      .select()
      .from(sportsSections)
      .where(eq(sportsSections.id, newRequest.sectionId));

    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, newRequest.branchId));

    const extendedRequest = {
      ...newRequest,
      section,
      branch
    };

    res.status(201).json(extendedRequest);
  } catch (error) {
    console.error('Error creating trial request:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}); */

// Получение всех заявок на пробное занятие (требует авторизации)
apiRoutes.get("/trial-requests", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Getting trial requests...');
    const requests = await db.select().from(trialRequests);
    console.log('Retrieved trial requests:', requests);

    // Дополняем информацией о секциях и филиалах
    const extendedRequests = await Promise.all(
      requests.map(async (request) => {
        const [section] = await db
          .select()
          .from(sportsSections)
          .where(eq(sportsSections.id, request.sectionId));

        const [branch] = await db
          .select()
          .from(branches)
          .where(eq(branches.id, request.branchId));

        return {
          ...request,
          section,
          branch,
        };
      })
    );

    res.json(extendedRequests);
  } catch (error) {
    console.error('Error getting trial requests:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Обновление статуса заявки на пробное занятие (требует авторизации)
apiRoutes.patch("/trial-requests/:id/status", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const id = parseInt(req.params.id);
    const { status, scheduledDate } = req.body;

    // Проверяем, что заявка существует
    const [existingRequest] = await db
      .select()
      .from(trialRequests)
      .where(eq(trialRequests.id, id));

    if (!existingRequest) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    // Обновляем статус заявки
    const [updatedRequest] = await db
      .update(trialRequests)
      .set({
        status,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : existingRequest.scheduledDate,
        updatedAt: new Date()
      })
      .where(eq(trialRequests.id, id))
      .returning();

    // Получаем информацию о секции и филиале
    const [section] = await db
      .select()
      .from(sportsSections)
      .where(eq(sportsSections.id, updatedRequest.sectionId));

    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, updatedRequest.branchId));

    // Формируем расширенный ответ
    const extendedRequest = {
      ...updatedRequest,
      section,
      branch
    };

    res.json(extendedRequest);
  } catch (error) {
    console.error('Error updating trial request status:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Получение вариантов дат для пробного занятия из расписания
apiRoutes.get("/trial-date-options", async (req, res) => {
  try {
    const branchSectionId = parseInt(req.query.branchSectionId as string);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();

    if (!branchSectionId) {
      return res.status(400).json({ error: "Missing branchSectionId parameter" });
    }

    // Получаем информацию о расписании для данной связки филиал-секция
    const [branchSectionInfo] = await db
      .select()
      .from(branchSections)
      .where(eq(branchSections.id, branchSectionId));

    if (!branchSectionInfo) {
      return res.status(404).json({ error: "Branch section not found" });
    }

    // Импортируем утилиты для работы с расписанием
    const { normalizeSchedule, getNextLessonDates } = await import('./utils/scheduleUtils');

    // Парсим расписание и получаем объект с расписанием по дням недели
    const schedule = normalizeSchedule(branchSectionInfo.schedule);

    // Генерируем ближайшие 5 дат на основе расписания
    const dateOptions = getNextLessonDates(schedule, 5);

    // Извлекаем текст расписания для отображения пользователю
    let scheduleText = '';
    if (typeof branchSectionInfo.schedule === 'string') {
      scheduleText = branchSectionInfo.schedule;
    } else if (branchSectionInfo.schedule && typeof branchSectionInfo.schedule === 'object') {
      if ('text' in branchSectionInfo.schedule) {
        // @ts-ignore
        scheduleText = branchSectionInfo.schedule.text || '';
      } else {
        scheduleText = JSON.stringify(branchSectionInfo.schedule);
      }
    }

    res.json({
      scheduleText,
      dateOptions
    });
  } catch (error) {
    console.error('Error getting trial date options:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

const app = express();

// Basic middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust first proxy
app.set("trust proxy", 1);

// Session configuration
import connectPgSimple from "connect-pg-simple";
const PostgresStore = connectPgSimple(session);

app.use(session({
  store: new PostgresStore({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    },
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  name: 'sid',
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/'
  }
}));

// Инициализация Passport (должна быть после настройки сессии)
import passport from "passport";
app.use(passport.initialize());
app.use(passport.session());

// Setup authentication
setupAuth(app);

// CORS middleware AFTER session setup
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, Set-Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Session ID:', req.sessionID);
  console.log('Session:', req.session);
  console.log('Auth Status:', req.isAuthenticated());
  next();
});

(async () => {
  // Регистрация API маршрутов из router.ts
  // Важно! Контроллеры и модули должны использоваться через registerRoutes
  const server = await registerRoutes(app);

  // Эндпоинт для получения студентов группы
apiRoutes.get("/group-students/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const groupId = parseInt(req.params.id);
    
    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    console.log(`Getting students for group ${groupId}`);
    
    // Используем метод из GroupStorage для получения студентов группы с деталями
    const students = await storage.getGroupStudentsWithDetails(groupId);
    
    console.log(`Found ${students.length} students in group ${groupId}`);
    
    res.json(students);
  } catch (error) {
    console.error('Error getting group students:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Глобальный обработчик ошибок должен быть последним middleware
  app.use(errorHandler);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();