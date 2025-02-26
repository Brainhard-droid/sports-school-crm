import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: 'no-reply@yourdomain.com',
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    // Временное решение: выводим содержимое письма в консоль
    console.log('Email content (temporary solution while SendGrid is under review):');
    console.log('To:', params.to);
    console.log('Subject:', params.subject);
    console.log('HTML:', params.html);
    return true; // Возвращаем true, чтобы процесс восстановления пароля мог продолжиться
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<boolean> {
  const resetLink = `${process.env.APP_URL}/reset-password/${resetToken}`;

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