import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { errorHandler } from "./middleware/error";
import apiRoutes from "./routes/index";
import { WebSocketServer } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Register modular API routes
  app.use('/api', apiRoutes);
  
  // Global error handler - must be last middleware
  app.use(errorHandler);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
