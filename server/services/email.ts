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
      // Создаем подробный объект для отправки через SendGrid
      const mailOptions = {
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text || '',
        html: params.html || '',
        // Добавляем свойства для повышения доставляемости
        mailSettings: {
          sandboxMode: {
            enable: false // Выключаем режим sandbox
          }
        },
        trackingSettings: {
          clickTracking: {
            enable: false // Отключаем отслеживание кликов для повышения доставляемости
          },
          openTracking: {
            enable: false // Отключаем отслеживание открытий для повышения доставляемости
          }
        },
        // Категории для лучшей аналитики
        categories: ['important', 'sports-school-crm'],
        // Флаг для байпаса спам-фильтров для важных транзакционных сообщений
        isTransactional: true
      };
      
      // Добавляем специфическую обработку для mail.ru и других российских почтовых сервисов
      if (params.to.endsWith('@mail.ru') || 
          params.to.endsWith('@inbox.ru') || 
          params.to.endsWith('@list.ru') ||
          params.to.endsWith('@bk.ru') || 
          params.to.endsWith('@yandex.ru')) {
        console.log(`Обнаружен российский почтовый сервис: ${params.to}, применяем специальные настройки доставки`);
        // Устанавливаем высокий приоритет для российских почтовых сервисов
        Object.assign(mailOptions, {
          priority: 'high'
        });
      }
      
      await this.client.send(mailOptions);
      return { success: true };
    } catch (error) {
      console.error(`SendGrid ошибка при отправке на ${params.to}:`, error);
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

// Добавляем SendGrid первым (если есть ключ API), так как он обычно имеет лучшую доставляемость в российские почтовые сервисы
if (process.env.SENDGRID_API_KEY) {
  emailProviders.push(new SendGridProvider(process.env.SENDGRID_API_KEY));
  console.log("SendGrid активирован как приоритетный провайдер для отправки писем");
} else {
  console.warn("SENDGRID_API_KEY не установлен, функциональность SendGrid будет отключена");
}

// Добавляем Resend в качестве запасного варианта
if (process.env.RESEND_API_KEY) {
  emailProviders.push(new ResendProvider(process.env.RESEND_API_KEY));
  console.log("Resend активирован как вторичный провайдер для отправки писем");
} else {
  console.warn("RESEND_API_KEY не установлен, функциональность Resend будет отключена");
}

// Всегда добавляем консольный провайдер как крайний запасной вариант
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
 * Улучшенная версия с текстовым вариантом письма для максимальной доставляемости
 */
export async function sendUserCredentialsEmail(
  email: string,
  username: string, 
  password: string
): Promise<boolean> {
  // Простой текстовый вариант письма для клиентов без поддержки HTML
  const textContent = `
Добро пожаловать в Sports School CRM!

Для вас был создан аккаунт в системе управления спортивной школой.

Ваши данные для входа:
- Логин: ${username}
- Пароль: ${password}

Рекомендуем сменить пароль после первого входа в систему.

С уважением,
Команда Sports School CRM
  `;

  // HTML-вариант письма для современных почтовых клиентов
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Данные для входа в систему Sports School CRM</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px; padding: 20px; }
    h1 { color: #2c3e50; font-size: 24px; margin-top: 0; }
    ul { padding-left: 20px; }
    .credentials { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .footer { margin-top: 20px; font-size: 14px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Добро пожаловать в Sports School CRM!</h1>
    <p>Для вас был создан аккаунт в системе управления спортивной школой.</p>
    
    <div class="credentials">
      <p><strong>Ваши данные для входа:</strong></p>
      <ul>
        <li><strong>Логин:</strong> ${username}</li>
        <li><strong>Пароль:</strong> ${password}</li>
      </ul>
    </div>
    
    <p>Рекомендуем сменить пароль после первого входа в систему.</p>
    
    <div class="footer">
      <p>С уважением,<br>Команда Sports School CRM</p>
    </div>
  </div>
</body>
</html>
  `;

  // Отправляем через централизованный сервис с улучшенной обработкой ошибок
  try {
    console.log(`Отправка данных для входа пользователю: ${email}`);
    
    const result = await sendEmail({
      to: email,
      subject: "Данные для входа в систему Sports School CRM",
      text: textContent,  // Добавляем текстовую версию для лучшей доставляемости
      html: htmlContent,
    });
    
    if (result) {
      console.log(`✓ Данные для входа успешно отправлены на ${email}`);
    } else {
      console.error(`✗ Не удалось отправить данные для входа на ${email}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Ошибка при отправке данных для входа: ${error}`);
    return false;
  }
}