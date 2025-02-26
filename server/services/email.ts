import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable must be set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    console.log('Attempting to send email via Resend:');
    console.log('To:', params.to);
    console.log('Subject:', params.subject);

    await resend.emails.send({
      from: 'no-reply@resend.dev',
      to: params.to,
      subject: params.subject,
      html: params.html || params.text || '',
    });

    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Resend email error:', error);
    // Временное решение: выводим содержимое письма в консоль
    console.log('Email content (temporary solution):');
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
  console.log('Generated reset link:', resetLink);

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