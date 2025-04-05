import { Express } from "express";
import { createServer, type Server } from "http";
import { setupAttendanceRoutes } from "./attendance";
import { setupBranchRoutes } from "./branches";
import { setupBranchSectionRoutes } from "./branch-sections";
import { setupGroupRoutes } from "./groups";
import { setupPaymentRoutes } from "./payments";
import { setupScheduleRoutes } from "./schedules";
import { setupSectionRoutes } from "./sections";
import { setupStudentRoutes } from "./students";
import { setupTrialRequestRoutes } from "./trial-requests";

export function registerRoutes(app: Express): Server {
  // Регистрируем все маршруты
  setupAttendanceRoutes(app);
  setupBranchRoutes(app);
  setupBranchSectionRoutes(app);
  setupGroupRoutes(app);
  setupPaymentRoutes(app);
  setupScheduleRoutes(app);
  setupSectionRoutes(app);
  setupStudentRoutes(app);
  setupTrialRequestRoutes(app);

  // Создаем HTTP сервер
  const httpServer = createServer(app);

  return httpServer;
}