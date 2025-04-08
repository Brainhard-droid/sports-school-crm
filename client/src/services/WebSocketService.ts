/**
 * WebSocketService - сервис для управления WebSocket соединениями
 * 
 * Следует принципам SOLID:
 * - Single Responsibility: отвечает только за работу с WebSocket
 * - Open/Closed: расширяемый через события
 * - Liskov Substitution: можно заменить на другую реализацию с тем же интерфейсом
 * - Interface Segregation: предоставляет минимально необходимый набор методов
 * - Dependency Inversion: зависит от абстракций, а не конкретных реализаций
 */
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Уменьшаем количество попыток
  private reconnectTimeout = 5000; // Увеличиваем таймаут
  private exponentialFactor = 1.5; // Фактор экспоненциального увеличения
  private listeners: Record<string, ((...args: any[]) => void)[]> = {};
  private isConnecting = false;
  private wasConnectedBefore = false;

  constructor() {}

  /**
   * Инициализирует WebSocket соединение
   */
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('WebSocket уже подключен или в процессе подключения');
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log(`Подключение к WebSocket: ${wsUrl}`);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Ошибка при создании WebSocket:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  /**
   * Отправляет данные через WebSocket
   */
  send(data: any): boolean {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    }
    console.warn('Не удалось отправить данные: WebSocket не подключен');
    return false;
  }

  /**
   * Проверяет, подключен ли сокет
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Закрывает WebSocket соединение
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Добавляет слушатель события
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Удаляет слушатель события
   */
  off(event: string, callback: (...args: any[]) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Вызывает все слушатели указанного события
   */
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

  private handleOpen(event: Event): void {
    console.log('WebSocket подключен:', event);
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.wasConnectedBefore = true;
    this.emit('connect', event);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('Получено сообщение WebSocket:', data);
      this.emit('message', data);

      // Также эмитим событие по типу сообщения, если он есть
      if (data?.type) {
        this.emit(data.type, data);
      }
    } catch (error) {
      console.error('Ошибка при обработке сообщения WebSocket:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket соединение закрыто:', event);
    this.socket = null;
    this.isConnecting = false;
    this.emit('disconnect', event);

    // Попытка переподключения только если ранее было успешное соединение
    if (this.wasConnectedBefore) {
      this.attemptReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('Ошибка WebSocket:', event);
    this.emit('error', event);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Превышено максимальное количество попыток переподключения (${this.maxReconnectAttempts})`);
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    const timeout = this.reconnectTimeout * Math.pow(this.exponentialFactor, this.reconnectAttempts -1);
    console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts} через ${timeout}ms`);

    setTimeout(() => {
      this.connect();
      this.emit('reconnect_attempt', this.reconnectAttempts);
    }, timeout);
  }
}

// Создаем и экспортируем единственный экземпляр сервиса
export const webSocketService = new WebSocketService();