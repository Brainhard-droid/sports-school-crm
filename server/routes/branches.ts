import { Express } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { 
  branches as branchesTable, 
  insertBranchSchema 
} from "@shared/schema";

export interface RouterModule {
  register: (app: Express) => void;
}

export const branchesRouter: RouterModule = {
  register: (app: Express) => {
    // Получить все филиалы
    app.get("/api/branches", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const branches = await db
          .select()
          .from(branchesTable);
          
        res.json(branches);
      } catch (error) {
        console.error('Error getting branches:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Получить один филиал по ID
    app.get("/api/branches/:id", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const id = parseInt(req.params.id);
        
        const [branch] = await db
          .select()
          .from(branchesTable)
          .where(eq(branchesTable.id, id));
          
        if (!branch) {
          return res.status(404).json({ error: "Branch not found" });
        }
        
        res.json(branch);
      } catch (error) {
        console.error('Error getting branch:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Создать новый филиал
    app.post("/api/branches", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const parsed = insertBranchSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json(parsed.error);
        
        const [branch] = await db
          .insert(branchesTable)
          .values(parsed.data)
          .returning();
          
        res.status(201).json(branch);
      } catch (error) {
        console.error('Error creating branch:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Обновить филиал
    app.patch("/api/branches/:id", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const id = parseInt(req.params.id);
        
        const [branch] = await db
          .update(branchesTable)
          .set(req.body)
          .where(eq(branchesTable.id, id))
          .returning();
          
        if (!branch) {
          return res.status(404).json({ error: "Branch not found" });
        }
        
        res.json(branch);
      } catch (error) {
        console.error('Error updating branch:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Удалить филиал (софт-удаление)
    app.delete("/api/branches/:id", async (req, res) => {
      try {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        
        const id = parseInt(req.params.id);
        
        // Софт-удаление - устанавливаем active в false
        const [branch] = await db
          .update(branchesTable)
          .set({ active: false })
          .where(eq(branchesTable.id, id))
          .returning();
        
        if (!branch) {
          return res.status(404).json({ error: "Branch not found" });
        }
        
        res.json(branch);
      } catch (error) {
        console.error('Error deleting branch:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });
  }
};