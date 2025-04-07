import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { errorHandler } from "./middleware/error";
import apiRoutes from "./routes/index";
import { initWebSocketService } from "./services/websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Register modular API routes
  app.use('/api', apiRoutes);
  
  // Global error handler - must be last middleware
  app.use(errorHandler);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  initWebSocketService(httpServer);

  return httpServer;
}
