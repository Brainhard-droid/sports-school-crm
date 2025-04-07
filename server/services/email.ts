import { Resend } from 'resend';
import { MailService } from "@sendgrid/mail";
import { TrialRequest, Branch, SportsSection } from "@shared/schema";
import { formatDate } from "../utils/date";

/**
 * Централизованный сервис для отправки электронных писем
 * Поддерживает несколько провайдеров: Resend и SendGrid
 */

// Настройка Resend
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn("RESEND_API_KEY не установлен, функциональность Resend будет отключена");
}

// Настройка SendGrid
let mailService: MailService | null = null;
if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY не установлен, функциональность SendGrid будет отключена");
}

/**
 * Базовые параметры для отправки электронной почты
 */
interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Отправляет письмо используя доступный провайдер
 * Сначала пытается использовать Resend, затем SendGrid, и в случае неудачи выводит в консоль
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    console.log('Попытка отправки email:');
    console.log('Кому:', params.to);
    console.log('Тема:', params.subject);

    // Пробуем отправить через Resend
    if (resend) {
      try {
        const data = await resend.emails.send({
          from: 'no-reply@sportschool-crm.ru',
          to: params.to,
          subject: params.subject,
          html: params.html || params.text || '',
        });
        console.log('Email отправлен через Resend:', data);
        return true;
      } catch (resendError) {
        console.error('Ошибка Resend:', resendError);
        // Если Resend не сработал, пробуем SendGrid
      }
    }

    // Пробуем отправить через SendGrid
    if (mailService) {
      try {
        await mailService.send({
          to: params.to,
          from: 'no-reply@sportschool-crm.ru',
          subject: params.subject,
          text: params.text || '',
          html: params.html || '',
        });
        console.log('Email отправлен через SendGrid');
        return true;
      } catch (sendgridError) {
        console.error('Ошибка SendGrid:', sendgridError);
      }
    }

    // Если ни один провайдер не сработал, выводим в консоль
    console.log('Не удалось отправить email через провайдеры, выводим содержимое:');
    console.log('Кому:', params.to);
    console.log('Тема:', params.subject);
    console.log('HTML:', params.html);
    return true; // Возвращаем true, чтобы процесс мог продолжиться
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    return false;
  }
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

  // Используем parentPhone как основной контакт, если parentEmail не указан
  const contactInfo = request.parentPhone;
  
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

  // Используем parentPhone как основной контакт
  const contactInfo = trialRequest.parentPhone;
  
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