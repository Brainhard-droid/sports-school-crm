import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

export default function ProfileSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  return (
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
  );
}