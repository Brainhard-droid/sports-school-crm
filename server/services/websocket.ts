import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';

interface Client {
  id: string;
  username: string;
  ws: WebSocket;
}

interface Message {
  type: 'message' | 'notification' | 'status';
  sender: string;
  content: string;
  timestamp: number;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });
    this.setupEvents();
  }

  private verifyClient(info: { origin: string; secure: boolean; req: any }) {
    try {
      const token = info.req.headers.cookie?.split('token=')[1]?.split(';')[0];
      if (!token) {
        console.log('WebSocket: Отказано в подключении - нет токена');
        return false;
      }
      return true;
    } catch (error) {
      console.error('WebSocket: Ошибка верификации:', error);
      return false;
    }
  }

  private setupEvents() {
    this.wss.on('connection', (ws) => {
      const clientId = uuidv4();
      console.log(`WebSocket client connected: ${clientId}`);
      
      // Store the client with a temporary username
      this.clients.set(clientId, {
        id: clientId,
        username: `User-${clientId.substring(0, 4)}`,
        ws
      });

      // Send a welcome message
      this.sendToClient(clientId, {
        type: 'status',
        sender: 'system',
        content: 'Connected to chat server',
        timestamp: Date.now()
      });

      // Notify all clients about the new connection
      this.broadcastUserList();

      ws.on('message', (messageData) => {
        try {
          const message = JSON.parse(messageData.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
        // Notify remaining clients about the disconnection
        this.broadcastUserList();
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });
    });
  }

  private handleMessage(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    
    if (!client) {
      return;
    }

    console.log(`Received message from ${client.username}:`, data);

    switch (data.type) {
      case 'chat':
        // Handle chat message
        const message: Message = {
          type: 'message',
          sender: client.username,
          content: data.content,
          timestamp: Date.now()
        };
        this.broadcast(message);
        break;
        
      case 'setUsername':
        // Update the username
        const oldUsername = client.username;
        client.username = data.username;
        this.clients.set(clientId, client);
        
        // Notify all clients about the username change
        this.broadcast({
          type: 'status',
          sender: 'system',
          content: `"${oldUsername}" is now known as "${data.username}"`,
          timestamp: Date.now()
        });
        
        this.broadcastUserList();
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private sendToClient(clientId: string, message: Message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: Message) {
    // Send the message to all connected clients
    for (const [clientId, client] of this.clients.entries()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  private broadcastUserList() {
    // Create a list of connected users
    const users = Array.from(this.clients.values()).map(client => ({
      id: client.id,
      username: client.username
    }));
    
    // Send the updated user list to all clients
    const message = {
      type: 'userList',
      sender: 'system',
      content: users,
      timestamp: Date.now()
    };
    
    this.broadcast(message as any);
  }

  // Public method to send notification to all clients
  public sendNotification(content: string) {
    this.broadcast({
      type: 'notification',
      sender: 'system',
      content,
      timestamp: Date.now()
    });
  }
}

let websocketService: WebSocketService | null = null;

export function initWebSocketService(server: Server): WebSocketService {
  if (!websocketService) {
    websocketService = new WebSocketService(server);
  }
  return websocketService;
}

export function getWebSocketService(): WebSocketService {
  if (!websocketService) {
    throw new Error('WebSocket service not initialized');
  }
  return websocketService;
}