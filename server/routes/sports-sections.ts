import { Express } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { 
  sportsSections as sportsTable, 
  insertSportsSectionSchema 
} from "@shared/schema";

export interface RouterModule {
  register: (app: Express) => void;
}

export const sportsSectionsRouter: RouterModule = {
  register: (app: Express) => {
    // Получить все спортивные секции
    app.get("/api/sports-sections", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const sections = await db
          .select()
          .from(sportsTable);
          
        res.json(sections);
      } catch (error) {
        console.error('Error getting sports sections:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Получить одну спортивную секцию по ID
    app.get("/api/sports-sections/:id", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const id = parseInt(req.params.id);
        
        const [section] = await db
          .select()
          .from(sportsTable)
          .where(eq(sportsTable.id, id));
          
        if (!section) {
          return res.status(404).json({ error: "Sports section not found" });
        }
        
        res.json(section);
      } catch (error) {
        console.error('Error getting sports section:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Создать новую спортивную секцию
    app.post("/api/sports-sections", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const parsed = insertSportsSectionSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json(parsed.error);
        
        const [section] = await db
          .insert(sportsTable)
          .values(parsed.data)
          .returning();
          
        res.status(201).json(section);
      } catch (error) {
        console.error('Error creating sports section:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Обновить спортивную секцию
    app.patch("/api/sports-sections/:id", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const id = parseInt(req.params.id);
        
        const [section] = await db
          .update(sportsTable)
          .set(req.body)
          .where(eq(sportsTable.id, id))
          .returning();
          
        if (!section) {
          return res.status(404).json({ error: "Sports section not found" });
        }
        
        res.json(section);
      } catch (error) {
        console.error('Error updating sports section:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Удалить спортивную секцию (софт-удаление)
    app.delete("/api/sports-sections/:id", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const id = parseInt(req.params.id);
        
        // Софт-удаление - устанавливаем active в false
        const [section] = await db
          .update(sportsTable)
          .set({ active: false })
          .where(eq(sportsTable.id, id))
          .returning();
        
        if (!section) {
          return res.status(404).json({ error: "Sports section not found" });
        }
        
        res.sendStatus(200);
      } catch (error) {
        console.error('Error deleting sports section:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });
  }
};