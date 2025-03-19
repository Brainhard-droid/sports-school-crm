import { MailService } from "@sendgrid/mail";
import { ExtendedTrialRequest } from "@shared/schema";
import { formatDate } from "../utils/date";

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendTrialAssignmentNotification(request: ExtendedTrialRequest) {
  try {
    const message = {
      to: request.parentEmail,
      from: "noreply@sportschool.com", // Замените на ваш подтвержденный email в SendGrid
      subject: "Назначено пробное занятие",
      text: `
Здравствуйте, ${request.parentName}!

Мы назначили пробное занятие для ${request.childName}:

Дата и время: ${formatDate(request.scheduledDate)}
Секция: ${request.section?.name}
Адрес: ${request.branch?.address}

Если у вас возникнут вопросы, пожалуйста, свяжитесь с нами:
Телефон: +7XXXXXXXXXX

С уважением,
Команда Sports School
      `,
      html: `
<h2>Здравствуйте, ${request.parentName}!</h2>

<p>Мы назначили пробное занятие для ${request.childName}:</p>

<ul>
  <li><strong>Дата и время:</strong> ${formatDate(request.scheduledDate)}</li>
  <li><strong>Секция:</strong> ${request.section?.name}</li>
  <li><strong>Адрес:</strong> ${request.branch?.address}</li>
</ul>

<p>Если у вас возникнут вопросы, пожалуйста, свяжитесь с нами:<br>
Телефон: +7XXXXXXXXXX</p>

<p>С уважением,<br>
Команда Sports School</p>
      `,
    };

    await mailService.send(message);
    return true;
  } catch (error) {
    console.error("Error sending trial assignment notification:", error);
    return false;
  }
}
