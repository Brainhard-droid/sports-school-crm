import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

export default function BranchesSettings() {
  const { t } = useTranslation();
  
  return (
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
  );
}