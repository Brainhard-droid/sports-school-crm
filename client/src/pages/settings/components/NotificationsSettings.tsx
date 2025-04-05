import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function NotificationsSettings() {
  const { t } = useTranslation();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  
  const handleSaveNotificationSettings = () => {
    toast({
      title: "Настройки уведомлений сохранены",
      description: "Ваши настройки уведомлений были успешно обновлены",
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Уведомления</CardTitle>
        <CardDescription>
          Настройки уведомлений и оповещений системы
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Способы уведомлений</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Email уведомления</Label>
              <p className="text-sm text-muted-foreground">
                Получать уведомления на электронную почту
              </p>
            </div>
            <Switch 
              id="email-notifications" 
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-notifications">SMS уведомления</Label>
              <p className="text-sm text-muted-foreground">
                Получать уведомления по SMS (платно)
              </p>
            </div>
            <Switch 
              id="sms-notifications" 
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Настройка шаблонов</h3>
          <div className="space-y-2">
            <Label htmlFor="trial-notification">Шаблон уведомления о пробном занятии</Label>
            <textarea 
              id="trial-notification" 
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue="Здравствуйте, {parentName}! Напоминаем, что пробное занятие для {childName} назначено на {date} в {time}. Адрес: {address}. С уважением, {schoolName}."
            />
            <p className="text-xs text-muted-foreground">
              Используйте переменные в фигурных скобках: {"{parentName}"}, {"{childName}"}, {"{date}"}, {"{time}"}, {"{address}"}, {"{schoolName}"}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSaveNotificationSettings}>Сохранить изменения</Button>
        </div>
      </CardContent>
    </Card>
  );
}