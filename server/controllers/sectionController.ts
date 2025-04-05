import { Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler, ApiErrorClass } from '../middleware/error';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { sportsSections, branches, branchSections } from '@shared/schema';

/**
 * Получение всех спортивных секций
 */
export const getAllSportsSections = asyncHandler(async (req: Request, res: Response) => {
  try {
    const sections = await db
      .select()
      .from(sportsSections)
      .where(eq(sportsSections.active, true)); // Только активные секции
    res.json(sections);
  } catch (error) {
    console.error('Error getting sports sections:', error);
    throw new ApiErrorClass('Ошибка при получении списка секций', 500);
  }
});

/**
 * Получение спортивной секции по ID
 */
export const getSportsSectionById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new ApiErrorClass('Некорректный ID секции', 400);
  }

  const section = await storage.getSportsSection(id);
  if (!section) {
    throw new ApiErrorClass('Секция не найдена', 404);
  }

  res.json(section);
});

/**
 * Создание новой спортивной секции
 */
export const createSportsSection = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, active = true } = req.body;

  // Создаем секцию
  const section = await storage.createSportsSection({
    name,
    description,
    active
  });

  res.status(201).json(section);
});

/**
 * Обновление спортивной секции
 */
export const updateSportsSection = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new ApiErrorClass('Некорректный ID секции', 400);
  }

  const { name, description, active } = req.body;

  // Проверяем, существует ли секция
  const existingSection = await storage.getSportsSection(id);
  if (!existingSection) {
    throw new ApiErrorClass('Секция не найдена', 404);
  }

  // Подготавливаем данные для обновления
  const updateData: any = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (active !== undefined) updateData.active = active;

  // Обновляем секцию
  const updatedSection = await storage.updateSportsSection(id, updateData);

  res.json(updatedSection);
});

/**
 * Удаление спортивной секции
 */
export const deleteSportsSection = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new ApiErrorClass('Некорректный ID секции', 400);
  }

  // Проверяем, существует ли секция
  const existingSection = await storage.getSportsSection(id);
  if (!existingSection) {
    throw new ApiErrorClass('Секция не найдена', 404);
  }

  // Удаляем секцию
  await storage.deleteSportsSection(id);

  res.status(204).send();
});

/**
 * Получение филиалов по секции
 */
export const getBranchesBySection = asyncHandler(async (req: Request, res: Response) => {
  const sectionId = parseInt(req.query.sectionId as string);
  if (!sectionId) {
    throw new ApiErrorClass("Missing sectionId parameter", 400);
  }

  try {
    const branchesList = await db
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

    // Преобразуем результат в нужный формат
    const formattedBranches = branchesList.map(branch => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      active: branch.active,
      schedule: branch.schedule,
      branchSectionId: branch.branchSectionId
    }));

    res.json(formattedBranches);
  } catch (error) {
    console.error('Error getting branches by section:', error);
    throw new ApiErrorClass('Ошибка при получении списка филиалов', 500);
  }
});

/**
 * Получение секций по филиалу
 */
export const getSectionsByBranch = asyncHandler(async (req: Request, res: Response) => {
  const branchId = parseInt(req.query.branchId as string);
  if (!branchId) {
    throw new ApiErrorClass("Missing branchId parameter", 400);
  }

  try {
    const sectionsList = await db
      .select({
        id: sportsSections.id,
        name: sportsSections.name,
        description: sportsSections.description,
        active: sportsSections.active,
        branchSectionId: branchSections.id,
        schedule: branchSections.schedule,
      })
      .from(branchSections)
      .innerJoin(sportsSections, eq(sportsSections.id, branchSections.sectionId))
      .where(
        and(
          eq(branchSections.branchId, branchId),
          eq(sportsSections.active, true),
          eq(branchSections.active, true)
        )
      );

    // Преобразуем результат в нужный формат
    const formattedSections = sectionsList.map(section => ({
      id: section.id,
      name: section.name,
      description: section.description,
      active: section.active,
      schedule: section.schedule,
      branchSectionId: section.branchSectionId
    }));

    res.json(formattedSections);
  } catch (error) {
    console.error('Error getting sections by branch:', error);
    throw new ApiErrorClass('Ошибка при получении списка секций', 500);
  }
});

/**
 * Создание связи между секцией и филиалом
 */
export const createBranchSection = asyncHandler(async (req: Request, res: Response) => {
  const { branchId, sectionId, schedule } = req.body;

  // Проверяем, существует ли филиал
  const branch = await storage.getBranch(branchId);
  if (!branch) {
    throw new ApiErrorClass('Филиал не найден', 404);
  }

  // Проверяем, существует ли секция
  const section = await storage.getSportsSection(sectionId);
  if (!section) {
    throw new ApiErrorClass('Секция не найдена', 404);
  }

  // Проверяем, не существует ли уже такой связи
  const existingConnection = await db
    .select()
    .from(branchSections)
    .where(
      and(
        eq(branchSections.branchId, branchId),
        eq(branchSections.sectionId, sectionId)
      )
    );

  if (existingConnection.length > 0) {
    throw new ApiErrorClass('Связь между этой секцией и филиалом уже существует', 400);
  }

  // Создаем связь
  const branchSection = await storage.createBranchSection({
    branchId,
    sectionId,
    schedule,
    active: true
  });

  res.status(201).json(branchSection);
});