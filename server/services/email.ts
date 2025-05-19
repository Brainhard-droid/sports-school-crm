import { Resend } from 'resend';
import { MailService } from "@sendgrid/mail";
import { TrialRequest, Branch, SportsSection } from "@shared/schema";
import { formatDate } from "../utils/date";

/**
 * Централизованный сервис для отправки электронных писем
 * Поддерживает несколько провайдеров: Resend и SendGrid
 * Реализация соответствует принципам SOLID
 */

// Интерфейс для email-провайдера (соблюдение принципа инверсии зависимостей)
interface EmailProvider {
  send(params: EmailSendParams): Promise<EmailSendResult>;
  getName(): string;
}

// Параметры для отправки email
interface EmailSendParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Результат отправки email
interface EmailSendResult {
  success: boolean;
  error?: Error;
  id?: string;
}

// Базовые параметры для отправки электронной почты без поля from
export interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Получение адреса отправителя из переменной окружения или значения по умолчанию
const FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@sportschool-crm.ru';

// Реализация провайдера Resend
class ResendProvider implements EmailProvider {
  private client: Resend;
  
  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }
  
  getName(): string {
    return 'Resend';
  }
  
  async send(params: EmailSendParams): Promise<EmailSendResult> {
    try {
      // Используем any, чтобы избежать проблем с типами
      const data: any = await this.client.emails.send({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html || params.text || '',
      });
      
      // Возвращаем унифицированный ответ
      return { 
        success: true, 
        id: data && data.id ? String(data.id) : ''
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// Реализация провайдера SendGrid
class SendGridProvider implements EmailProvider {
  private client: MailService;
  
  constructor(apiKey: string) {
    this.client = new MailService();
    this.client.setApiKey(apiKey);
  }
  
  getName(): string {
    return 'SendGrid';
  }
  
  async send(params: EmailSendParams): Promise<EmailSendResult> {
    try {
      await this.client.send({
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text || '',
        html: params.html || '',
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// Реализация провайдера для вывода в консоль
class ConsoleProvider implements EmailProvider {
  getName(): string {
    return 'Console';
  }
  
  async send(params: EmailSendParams): Promise<EmailSendResult> {
    console.log('========= EMAIL START =========');
    console.log('От:', params.from);
    console.log('Кому:', params.to);
    console.log('Тема:', params.subject);
    console.log('Текст:', params.text || '');
    console.log('HTML:', params.html || '');
    console.log('========= EMAIL END ===========');
    
    return { success: true };
  }
}

// Инициализация провайдеров
const emailProviders: EmailProvider[] = [];

// Добавляем Resend, если есть ключ API
if (process.env.RESEND_API_KEY) {
  emailProviders.push(new ResendProvider(process.env.RESEND_API_KEY));
} else {
  console.warn("RESEND_API_KEY не установлен, функциональность Resend будет отключена");
}

// Добавляем SendGrid, если есть ключ API
if (process.env.SENDGRID_API_KEY) {
  emailProviders.push(new SendGridProvider(process.env.SENDGRID_API_KEY));
} else {
  console.warn("SENDGRID_API_KEY не установлен, функциональность SendGrid будет отключена");
}

// Всегда добавляем консольный провайдер как запасной вариант
emailProviders.push(new ConsoleProvider());

/**
 * Сервис для отправки писем с механизмом повторных попыток через разные провайдеры
 * Соблюдает принцип единственной ответственности (SRP) и принцип открытости/закрытости (OCP)
 */
class EmailService {
  private readonly maxRetries: number = 2; // Максимальное количество попыток на одного провайдера
  private readonly retryDelayMs: number = 1000; // Задержка между попытками в миллисекундах
  
  /**
   * Отправляет email используя доступные провайдеры с механизмом повторных попыток
   */
  async send(params: EmailParams): Promise<boolean> {
    console.log('Попытка отправки email:');
    console.log('Кому:', params.to);
    console.log('Тема:', params.subject);
    
    // Проверка корректности email адреса
    if (!this.isValidEmail(params.to)) {
      console.error('Неверный адрес получателя:', params.to);
      return false;
    }
    
    // Перебираем всех провайдеров
    for (const provider of emailProviders) {
      let retryCount = 0;
      
      // Пробуем отправить с повторными попытками
      while (retryCount < this.maxRetries) {
        console.log(`Попытка #${retryCount + 1} через провайдера ${provider.getName()}`);
        
        const result = await provider.send({
          ...params,
          from: FROM_EMAIL,
        });
        
        if (result.success) {
          console.log(`Email успешно отправлен через ${provider.getName()}`);
          return true;
        }
        
        console.error(`Ошибка отправки через ${provider.getName()}:`, result.error);
        
        // Если это не последняя попытка, ждем перед повтором
        if (retryCount < this.maxRetries - 1) {
          await this.delay(this.retryDelayMs);
        }
        
        retryCount++;
      }
    }
    
    console.error('Не удалось отправить email через все доступные провайдеры');
    return false;
  }
  
  /**
   * Проверяет, является ли строка корректным email-адресом
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Создает промис, который разрешается через указанное время
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Создаем экземпляр сервиса
const emailService = new EmailService();

/**
 * Отправляет письмо через централизованный сервис
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  return emailService.send(params);
}

/**
 * Отправляет email для сброса пароля
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<boolean> {
  // Используем window.location.origin с клиента или хардкодим URL для разработки
  const resetLink = `https://2644c3d0-7e0b-49ec-ae79-4cb7aaf0a317-00-etncsd5juxsk.riker.replit.dev/reset-password/${resetToken}`;
  console.log('Сгенерирована ссылка для сброса пароля:', resetLink);

  return sendEmail({
    to: email,
    subject: 'Сброс пароля',
    html: `
      <h1>Сброс пароля</h1>
      <p>Вы запросили сброс пароля. Перейдите по ссылке ниже, чтобы установить новый пароль:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Ссылка действительна в течение 1 часа.</p>
      <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
    `,
  });
}

/**
 * Отправляет уведомление о назначении пробного занятия
 */
export async function sendTrialAssignmentNotification(request: TrialRequest, 
  section: SportsSection, 
  branch: Branch): Promise<boolean> {
  
  const scheduledDate = request.scheduledDate 
    ? (typeof request.scheduledDate === 'string' 
        ? new Date(request.scheduledDate) 
        : request.scheduledDate)
    : null;

  const formattedDate = scheduledDate 
    ? formatDate(scheduledDate) 
    : 'Дата не назначена';

  // Используем parentPhone как контактную информацию, проверим, является ли она email-адресом
  const contactInfo = request.parentPhone;
  
  // Проверяем, является ли контакт email-адресом
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo);
  
  // Если это не email, используем консольный вывод
  if (!isEmail) {
    console.warn('Предоставленные контактные данные не являются email-адресом. Уведомление будет залогировано в консоли.');
    
    // Выводим содержимое в консоль вместо отправки email
    console.log(`========= TRIAL ASSIGNMENT EMAIL =========`);
    console.log(`To: ${contactInfo} (SMS шлюз или другой метод доставки)`);
    console.log(`Subject: Назначено пробное занятие`);
    console.log(`Body: Здравствуйте, ${request.parentName}! Мы назначили пробное занятие для ${request.childName}. Дата и время: ${formattedDate}. Секция: ${section.name}. Адрес: ${branch.address}`);
    console.log(`=========================================`);
    
    // Возвращаем true, чтобы не блокировать процесс
    return true;
  }
  
  // Если это email, отправляем через email-сервис
  return sendEmail({
    to: contactInfo,
    subject: "Назначено пробное занятие",
    text: `
Здравствуйте, ${request.parentName}!

Мы назначили пробное занятие для ${request.childName}:

Дата и время: ${formattedDate}
Секция: ${section.name}
Адрес: ${branch.address}

Если у вас возникнут вопросы, пожалуйста, свяжитесь с нами:
Телефон: +7XXXXXXXXXX

С уважением,
Команда Sports School
    `,
    html: `
<h2>Здравствуйте, ${request.parentName}!</h2>

<p>Мы назначили пробное занятие для ${request.childName}:</p>

<ul>
  <li><strong>Дата и время:</strong> ${formattedDate}</li>
  <li><strong>Секция:</strong> ${section.name}</li>
  <li><strong>Адрес:</strong> ${branch.address}</li>
</ul>

<p>Если у вас возникнут вопросы, пожалуйста, свяжитесь с нами:<br>
Телефон: +7XXXXXXXXXX</p>

<p>С уважением,<br>
Команда Sports School</p>
    `,
  });
}

/**
 * Отправляет уведомление о подтверждении получения заявки
 */
export async function sendTrialRequestConfirmation(
  trialRequest: TrialRequest,
  section: SportsSection,
  branch: Branch
): Promise<boolean> {
  const desiredDate = trialRequest.desiredDate 
    ? (typeof trialRequest.desiredDate === 'string' 
        ? new Date(trialRequest.desiredDate) 
        : trialRequest.desiredDate)
    : new Date();

  // Используем parentPhone как контактную информацию
  const contactInfo = trialRequest.parentPhone;
  
  // Проверяем, является ли контакт email-адресом
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo);
  
  // Если это не email, выводим информацию в консоль
  if (!isEmail) {
    console.warn('Предоставленные контактные данные не являются email-адресом. Уведомление будет залогировано в консоли.');
    
    // Выводим содержимое в консоль вместо отправки email
    console.log(`========= TRIAL REQUEST CONFIRMATION =========`);
    console.log(`To: ${contactInfo} (SMS шлюз или другой метод доставки)`);
    console.log(`Subject: Заявка на пробное занятие получена`);
    console.log(`Body: Здравствуйте, ${trialRequest.parentName}! Мы получили вашу заявку на пробное занятие для ${trialRequest.childName}. Секция: ${section.name}. Филиал: ${branch.name} (${branch.address}). Желаемая дата: ${formatDate(desiredDate)}. Наш администратор свяжется с вами в ближайшее время.`);
    console.log(`============================================`);
    
    // Возвращаем true, чтобы не блокировать процесс
    return true;
  }
  
  // Если это email, отправляем через email-сервис
  return sendEmail({
    to: contactInfo,
    subject: "Заявка на пробное занятие получена",
    html: `
<h2>Здравствуйте, ${trialRequest.parentName}!</h2>

<p>Мы получили вашу заявку на пробное занятие для ${trialRequest.childName}.</p>

<p>Детали заявки:</p>
<ul>
  <li><strong>Секция:</strong> ${section.name}</li>
  <li><strong>Филиал:</strong> ${branch.name} (${branch.address})</li>
  <li><strong>Желаемая дата:</strong> ${formatDate(desiredDate)}</li>
</ul>

<p>Наш администратор свяжется с вами в ближайшее время для подтверждения даты и времени пробного занятия.</p>

<p>С уважением,<br>
Команда Sports School</p>
    `,
  });
}

/**
 * Отправляет данные для входа новому пользователю
 */
export async function sendUserCredentialsEmail(
  email: string,
  username: string, 
  password: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Данные для входа в систему Sports School CRM",
    html: `
<h1>Добро пожаловать в Sports School CRM!</h1>
<p>Для вас был создан аккаунт в системе управления спортивной школой.</p>
<p>Ваши данные для входа:</p>
<ul>
  <li><strong>Логин:</strong> ${username}</li>
  <li><strong>Пароль:</strong> ${password}</li>
</ul>
<p>Рекомендуем сменить пароль после первого входа в систему.</p>
<p>С уважением,<br>Команда Sports School CRM</p>
    `,
  });
}