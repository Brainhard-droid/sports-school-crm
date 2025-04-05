import { Express } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { 
  branchSections,
  branches as branchesTable,
  sportsSections as sportsTable,
  insertBranchSectionSchema 
} from "@shared/schema";

export interface RouterModule {
  register: (app: Express) => void;
}

export const branchSectionsRouter: RouterModule = {
  register: (app: Express) => {
    // Получить все связи филиалов и секций
    app.get("/api/branch-sections", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        // Получаем все связи филиалов и секций
        const branchSectionsList = await db
          .select()
          .from(branchSections);
        
        res.json(branchSectionsList);
      } catch (error) {
        console.error('Error getting branch sections:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Создать новую связь филиала и секции
    app.post("/api/branch-sections", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const parsed = insertBranchSectionSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json(parsed.error);
        
        // Проверяем, существуют ли филиал и секция
        const [branch] = await db
          .select()
          .from(branchesTable)
          .where(eq(branchesTable.id, parsed.data.branchId));
        
        const [section] = await db
          .select()
          .from(sportsTable)
          .where(eq(sportsTable.id, parsed.data.sectionId));
        
        if (!branch || !section) {
          return res.status(400).json({ error: "Branch or section not found" });
        }
        
        // Вставляем связь филиала и секции
        const [branchSection] = await db
          .insert(branchSections)
          .values(parsed.data)
          .returning();
        
        res.status(201).json(branchSection);
      } catch (error) {
        console.error('Error creating branch section:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Получить одну связь филиала и секции по ID
    app.get("/api/branch-sections/:id", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const id = parseInt(req.params.id);
        
        const [branchSection] = await db
          .select()
          .from(branchSections)
          .where(eq(branchSections.id, id));
        
        if (!branchSection) {
          return res.status(404).json({ error: "Branch section not found" });
        }
        
        res.json(branchSection);
      } catch (error) {
        console.error('Error getting branch section:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Обновить связь филиала и секции
    app.patch("/api/branch-sections/:id", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const id = parseInt(req.params.id);
        
        // Проверяем, существует ли связь филиала и секции
        const [existingBranchSection] = await db
          .select()
          .from(branchSections)
          .where(eq(branchSections.id, id));
        
        if (!existingBranchSection) {
          return res.status(404).json({ error: "Branch section not found" });
        }
        
        // Обновляем связь филиала и секции
        const [updatedBranchSection] = await db
          .update(branchSections)
          .set(req.body)
          .where(eq(branchSections.id, id))
          .returning();
        
        res.json(updatedBranchSection);
      } catch (error) {
        console.error('Error updating branch section:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Удалить связь филиала и секции (софт-удаление)
    app.delete("/api/branch-sections/:id", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const id = parseInt(req.params.id);
        
        // Софт-удаление - устанавливаем active в false
        const [branchSection] = await db
          .update(branchSections)
          .set({ active: false })
          .where(eq(branchSections.id, id))
          .returning();
        
        res.json(branchSection);
      } catch (error) {
        console.error('Error deleting branch section:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });
  }
};