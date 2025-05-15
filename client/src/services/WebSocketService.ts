export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.ws = new WebSocket(`${protocol}//${host}/ws`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.tryReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  private tryReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), 2000);
    }
  }

  send(message: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }

  private listeners: Record<string, ((...args: any[]) => void)[]> = {};
  private isConnecting = false;
  private wasConnectedBefore = false;

  constructor() {}

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, ...args: any[]): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Ошибка в обработчике события ${event}:`, error);
        }
      });
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('Получено сообщение WebSocket:', data);
      this.emit('message', data);

      if (data?.type) {
        this.emit(data.type, data);
      }
    } catch (error) {
      console.error('Ошибка при обработке сообщения WebSocket:', error);
    }
  }
}

export const webSocketService = new WebSocketService();