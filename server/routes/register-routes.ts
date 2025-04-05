import { Express } from "express";
import { createServer, type Server } from "http";
import { branchesRouter } from "./branches";
import { sportsSectionsRouter } from "./sports-sections";
import { branchSectionsRouter } from "./branch-sections";

// Импортировать другие маршруты по мере добавления

export function registerRoutes(app: Express): Server {
  // Регистрируем все маршруты
  branchesRouter.register(app);
  sportsSectionsRouter.register(app);
  branchSectionsRouter.register(app);
  
  // Добавлять другие маршруты по мере создания
  
  const httpServer = createServer(app);
  return httpServer;
}