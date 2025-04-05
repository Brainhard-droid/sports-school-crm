import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

export default function GeneralSettings() {
  const { t } = useTranslation();
  
  return (
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
  );
}