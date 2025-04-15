/**
 * Supervisor для запуска сервера
 * Основан на принципах SOLID и паттерне Наблюдатель
 */
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем текущую директорию
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Интерфейс для наблюдателя
interface Observer {
  update(event: string, data?: any): void;
}

// Класс наблюдаемого объекта
class Observable {
  private observers: Observer[] = [];

  addObserver(observer: Observer): void {
    this.observers.push(observer);
  }

  removeObserver(observer: Observer): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  notifyObservers(event: string, data?: any): void {
    this.observers.forEach(observer => observer.update(event, data));
  }
}

// Класс для запуска и мониторинга процесса
class ProcessManager extends Observable {
  private process: ChildProcess | null = null;
  private restartAttempts = 0;
  private maxRestartAttempts = 5;
  private startTime = 0;
  private isRunning = false;

  constructor(private scriptPath: string) {
    super();
  }

  start(): void {
    if (this.isRunning) {
      console.log('Процесс уже запущен');
      return;
    }

    this.startTime = Date.now();
    this.isRunning = true;

    // Запускаем процесс Node.js с --inspect для отладки
    this.process = spawn('node', ['--inspect', this.scriptPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: process.env.PORT || '5000',
        SERVER_SUPERVISED: 'true' // Флаг для процесса, что он запущен под управлением
      }
    });

    console.log(`Запущен процесс с PID ${this.process.pid}`);
    this.notifyObservers('start', { pid: this.process.pid });

    // Обработка завершения процесса
    this.process.on('exit', (code, signal) => {
      this.isRunning = false;
      
      console.log(`Процесс завершен с кодом ${code}, сигнал: ${signal}`);
      this.notifyObservers('exit', { code, signal });

      // Проверяем, нужно ли перезапустить
      const runtime = (Date.now() - this.startTime) / 1000;
      
      // Если процесс работал меньше 10 секунд, увеличиваем счетчик попыток
      if (runtime < 10) {
        this.restartAttempts++;
        console.log(`Процесс работал только ${runtime.toFixed(2)} секунд. Попытка рестарта ${this.restartAttempts}/${this.maxRestartAttempts}`);
      } else {
        // Если процесс работал больше 10 секунд, сбрасываем счетчик
        this.restartAttempts = 0;
      }

      // Если количество попыток не превышает максимум, перезапускаем
      if (this.restartAttempts < this.maxRestartAttempts) {
        console.log('Перезапуск процесса...');
        setTimeout(() => this.start(), 1000); // Задержка перед рестартом
      } else {
        console.error('Превышено максимальное количество попыток перезапуска');
        this.notifyObservers('max_restart_attempts');
      }
    });

    // Обработка ошибок
    this.process.on('error', (err) => {
      console.error('Ошибка процесса:', err);
      this.notifyObservers('error', err);
    });
  }

  stop(): void {
    if (!this.isRunning || !this.process) {
      console.log('Процесс не запущен');
      return;
    }

    console.log(`Остановка процесса с PID ${this.process.pid}`);
    this.process.kill();
    this.isRunning = false;
    this.notifyObservers('stop');
  }

  restart(): void {
    console.log('Перезапуск процесса...');
    this.stop();
    setTimeout(() => this.start(), 1000);
  }

  isProcessRunning(): boolean {
    return this.isRunning;
  }
}

// Класс для мониторинга и логирования
class ProcessMonitor implements Observer {
  update(event: string, data?: any): void {
    const timestamp = new Date().toISOString();
    
    switch (event) {
      case 'start':
        console.log(`[${timestamp}] Процесс запущен с PID ${data.pid}`);
        break;
      case 'exit':
        console.log(`[${timestamp}] Процесс завершен. Код: ${data.code}, Сигнал: ${data.signal}`);
        break;
      case 'error':
        console.error(`[${timestamp}] Ошибка процесса:`, data);
        break;
      case 'stop':
        console.log(`[${timestamp}] Процесс остановлен`);
        break;
      case 'max_restart_attempts':
        console.error(`[${timestamp}] Превышено максимальное количество попыток перезапуска`);
        process.exit(1); // Завершаем supervisor при превышении попыток
        break;
      default:
        console.log(`[${timestamp}] Событие: ${event}`, data);
    }
  }
}

// Основная функция для запуска supervisor
async function main() {
  // Путь к основному файлу сервера
  const serverPath = path.resolve(__dirname, 'index.ts');
  
  // Создаем менеджер процессов
  const manager = new ProcessManager(serverPath);
  
  // Добавляем монитор
  const monitor = new ProcessMonitor();
  manager.addObserver(monitor);
  
  // Обработка сигналов для корректного завершения
  process.on('SIGINT', () => {
    console.log('Получен сигнал SIGINT, завершаем работу...');
    manager.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('Получен сигнал SIGTERM, завершаем работу...');
    manager.stop();
    process.exit(0);
  });
  
  // Запускаем процесс
  manager.start();
  
  console.log('Supervisor запущен и мониторит процесс сервера');
}

// Запускаем основную функцию
main().catch(err => {
  console.error('Ошибка в supervisor:', err);
  process.exit(1);
});