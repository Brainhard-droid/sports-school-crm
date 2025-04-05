import { Router } from 'express';
import userRoutes from './userRoutes';
import trialRequestRoutes from './trialRequestRoutes';
import sectionRoutes from './sectionRoutes';
import branchRoutes from './branchRoutes';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { 
  sportsSections, 
  branches, 
  branchSections,
  trialRequests,
  TrialRequestStatus
} from "@shared/schema";
import { notFoundHandler } from '../middleware/error';
import { storage } from '../storage';

// Основной роутер для API
const router = Router();

// Прямые маршруты API не требующие авторизации для пользователя сайта
router.get("/sports-sections", async (_req, res) => {
  try {
    const sections = await db
      .select()
      .from(sportsSections)
      .where(eq(sportsSections.active, true)); // Только активные секции
    res.json(sections);
  } catch (error) {
    console.error('Error getting sports sections:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Маршрут для получения филиалов по секции
router.get("/branches-by-section", async (req, res) => {
  try {
    const sectionId = parseInt(req.query.sectionId as string);
    if (!sectionId) {
      return res.status(400).json({ error: "Missing sectionId parameter" });
    }

    // Получаем только активные филиалы с расписанием для выбранной секции
    const branchesWithSchedule = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        schedule: branchSections.schedule
      })
      .from(branchSections)
      .innerJoin(branches, eq(branches.id, branchSections.branchId))
      .where(
        and(
          eq(branchSections.sectionId, sectionId),
          eq(branchSections.active, true),
          eq(branches.active, true)
        )
      );

    res.json(branchesWithSchedule);
  } catch (error) {
    console.error('Error getting branches by section:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Маршрут для обработки заявок на пробное занятие
router.post('/trial-requests', async (req, res) => {
  try {
    const {
      childName,
      childAge,
      parentName,
      parentPhone,
      parentEmail,
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
});

// Маршрут для получения вариантов дат для пробного занятия из расписания
router.get("/trial-date-options", async (req, res) => {
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
    const { parseScheduleFromAnyFormat, getNextLessonDates } = await import('../utils/schedule');

    // Парсим расписание и получаем объект с расписанием по дням недели
    const schedule = parseScheduleFromAnyFormat(branchSectionInfo.schedule);

    // Генерируем ближайшие 5 дат на основе расписания
    const dateOptions = getNextLessonDates(schedule, startDate, 5);

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

// Регистрируем подроутеры для авторизованных маршрутов
router.use('/users', userRoutes);
router.use('/trial-requests', trialRequestRoutes);
router.use('/sections', sectionRoutes);
router.use('/branches', branchRoutes);

// Имортируем все API из контроллеров, эти маршруты требуют авторизации
router.get('/branch-sections', async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const showAll = req.query.showAll === 'true';
    
    const data = await db
      .select({
        id: branchSections.id,
        branchId: branchSections.branchId,
        sectionId: branchSections.sectionId,
        schedule: branchSections.schedule,
        active: branchSections.active
      })
      .from(branchSections)
      .where(showAll ? undefined : eq(branchSections.active, true));
      
    res.json(data);
  } catch (error) {
    console.error('Error getting branch sections:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Обработка несуществующих маршрутов
router.use('*', notFoundHandler);

export default router;