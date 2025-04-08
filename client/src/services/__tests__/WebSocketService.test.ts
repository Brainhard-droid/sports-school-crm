import { WebSocketService } from '../WebSocketService';

// Мок для WebSocket API
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  readyState = 0; // CONNECTING
  
  constructor(public url: string) {
    // Имитируем успешное подключение после небольшой задержки
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen(new Event('open'));
    }, 50);
  }
  
  send(data: string): void {
    // Здесь можно добавить логику для тестирования отправки данных
  }
  
  close(): void {
    this.readyState = 2; // CLOSING
    setTimeout(() => {
      this.readyState = 3; // CLOSED
      if (this.onclose) this.onclose(new CloseEvent('close'));
    }, 50);
  }
}

// Константы для тестирования
const READY_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

// Переопределяем глобальный WebSocket на наш мок
global.WebSocket = MockWebSocket as any;

describe('WebSocketService', () => {
  let service: WebSocketService;
  let originalConsole: Console;
  
  beforeEach(() => {
    // Сохраняем оригинальную консоль и подменяем ее методы
    originalConsole = { ...console };
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    
    // Создаем новый экземпляр сервиса для каждого теста
    service = new WebSocketService();
  });
  
  afterEach(() => {
    // Восстанавливаем консоль
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });
  
  test('должен подключаться к WebSocket при вызове connect', () => {
    // Arrange
    const connectSpy = jest.spyOn(service as any, 'handleOpen');
    
    // Act
    service.connect();
    
    // Assert
    expect(connectSpy).not.toHaveBeenCalled(); // Сразу после connect handleOpen не должен быть вызван
    
    // Так как подключение асинхронное, нужно подождать
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(connectSpy).toHaveBeenCalled();
        resolve();
      }, 100);
    });
  });
  
  test('должен добавлять и вызывать слушатели событий', () => {
    // Arrange
    const mockListener = jest.fn();
    service.on('connect', mockListener);
    
    // Act
    service.connect();
    
    // Assert
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(mockListener).toHaveBeenCalled();
        resolve();
      }, 100);
    });
  });
  
  test('должен удалять слушатели событий', () => {
    // Arrange
    const mockListener1 = jest.fn();
    const mockListener2 = jest.fn();
    
    service.on('testEvent', mockListener1);
    service.on('testEvent', mockListener2);
    
    // Act
    service.off('testEvent', mockListener1);
    (service as any).emit('testEvent', { data: 'test' });
    
    // Assert
    expect(mockListener1).not.toHaveBeenCalled();
    expect(mockListener2).toHaveBeenCalled();
  });
  
  test('должен обрабатывать сообщения и эмитить соответствующие события', () => {
    // Arrange
    const messageListener = jest.fn();
    const typeListener = jest.fn();
    
    service.on('message', messageListener);
    service.on('testType', typeListener);
    
    // Act - имитируем получение сообщения
    const mockMessage = new MessageEvent('message', {
      data: JSON.stringify({ type: 'testType', content: 'test' })
    });
    
    service.connect();
    
    return new Promise<void>(resolve => {
      setTimeout(() => {
        // Имитируем получение сообщения через вызов обработчика напрямую
        const socket = (service as any).socket;
        if (socket && socket.onmessage) {
          socket.onmessage(mockMessage);
        }
        
        // Assert
        expect(messageListener).toHaveBeenCalled();
        expect(typeListener).toHaveBeenCalled();
        resolve();
      }, 100);
    });
  });
  
  test('должен отправлять данные, когда соединение установлено', () => {
    // Arrange
    const testData = { type: 'test', data: 'message' };
    let sentData: string | null = null;
    
    // Act
    service.connect();
    
    return new Promise<void>(resolve => {
      setTimeout(() => {
        // Перехватываем данные, отправляемые через WebSocket
        const socket = (service as any).socket;
        const originalSend = socket.send;
        socket.send = (data: string) => {
          sentData = data;
          return originalSend.call(socket, data);
        };
        
        service.send(testData);
        
        // Assert
        expect(sentData).toBe(JSON.stringify(testData));
        resolve();
      }, 100);
    });
  });
  
  test('не должен отправлять данные, когда соединение не установлено', () => {
    // Arrange
    const testData = { type: 'test', data: 'message' };
    
    // Act - пытаемся отправить данные без установленного соединения
    const result = service.send(testData);
    
    // Assert
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalled();
  });
  
  test('должен пытаться переподключиться при обрыве соединения', () => {
    // Arrange
    const reconnectSpy = jest.spyOn(service as any, 'attemptReconnect');
    
    // Act
    service.connect();
    
    return new Promise<void>(resolve => {
      setTimeout(() => {
        // Имитируем обрыв соединения
        const socket = (service as any).socket;
        if (socket && socket.onclose) {
          socket.onclose(new CloseEvent('close'));
        }
        
        // Assert
        expect(reconnectSpy).toHaveBeenCalled();
        resolve();
      }, 100);
    });
  });
});