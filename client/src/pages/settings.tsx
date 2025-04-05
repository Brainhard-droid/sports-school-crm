import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { Settings as SettingsIcon, User, Building, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  
  const handleSaveNotificationSettings = () => {
    toast({
      title: "Настройки уведомлений сохранены",
      description: "Ваши настройки уведомлений были успешно обновлены",
    });
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <SettingsIcon className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Настройки</h1>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">Общие</TabsTrigger>
          <TabsTrigger value="profile">Профиль</TabsTrigger>
          <TabsTrigger value="branches">Филиалы и секции</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
        </TabsList>

        {/* Общие настройки */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Общие настройки</CardTitle>
              <CardDescription>
                Настройки интерфейса и языка системы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Внешний вид</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode">Темная тема</Label>
                    <p className="text-sm text-muted-foreground">
                      Включить темную тему интерфейса
                    </p>
                  </div>
                  <Switch id="dark-mode" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Региональные настройки</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date-format" className="col-span-1">
                      Формат даты
                    </Label>
                    <select 
                      id="date-format" 
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="dd.mm.yyyy">DD.MM.YYYY</option>
                      <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                      <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Сохранить изменения</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Настройки профиля */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Профиль пользователя</CardTitle>
              <CardDescription>
                Управление учетной записью и личными данными
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Данные пользователя</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Имя пользователя</Label>
                    <Input id="username" defaultValue={user?.username} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email} />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Изменение пароля</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Текущий пароль</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div></div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">Новый пароль</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Сохранить изменения</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Настройки филиалов и секций */}
        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle>Филиалы и спортивные секции</CardTitle>
              <CardDescription>
                Управление филиалами школы и спортивными секциями
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Филиалы</h3>
                  <Button>Добавить филиал</Button>
                </div>
                <div className="border rounded-md">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">ДК Энергетик</h4>
                        <p className="text-sm text-muted-foreground">ул. Красного Маяка, 28</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Редактировать</Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Спортивный центр "Луч"</h4>
                        <p className="text-sm text-muted-foreground">ул. Профсоюзная, 156</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Редактировать</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Спортивные секции</h3>
                  <Button>Добавить секцию</Button>
                </div>
                <div className="border rounded-md">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Художественная гимнастика</h4>
                        <p className="text-sm text-muted-foreground">Развитие гибкости, координации и грации</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Редактировать</Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Спортивные бальные танцы</h4>
                        <p className="text-sm text-muted-foreground">Обучение танцевальным навыкам в паре</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Редактировать</Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Хип-хоп</h4>
                        <p className="text-sm text-muted-foreground">Современные танцевальные стили и хореография</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Редактировать</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Настройки уведомлений */}
        <TabsContent value="notifications">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}