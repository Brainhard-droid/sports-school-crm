import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, MoreVertical } from "lucide-react";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface TrialRequestCardProps {
  request: ExtendedTrialRequest;
  onEdit: (request: ExtendedTrialRequest) => void;
  onAssignTrial: (request: ExtendedTrialRequest) => void;
  onReject: (request: ExtendedTrialRequest) => void;
}

export function TrialRequestCard({ request, onEdit, onAssignTrial, onReject }: TrialRequestCardProps) {
  return (
    <Card className="mb-2">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold">{request.childName}</h3>
            <p className="text-sm text-muted-foreground">{request.childAge} лет</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(request)}>
                Редактировать
              </DropdownMenuItem>
              
              {/* Всегда показываем пункт меню "Назначить/Перенести пробное" для всех типов заявок */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAssignTrial(request)}>
                {request.status === "TRIAL_ASSIGNED"
                  ? "Перенести пробное"
                  : "Назначить пробное"}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onReject(request)}
                className="text-destructive focus:text-destructive"
              >
                Отказ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {request.scheduledDate
                ? `Пробное: ${formatDate(request.scheduledDate)}`
                : (() => {
                    // Проверяем, есть ли информация о времени в notes (формат "TIME:16:30")
                    const timeMatch = request.notes?.match(/TIME:(\d{1,2}:\d{2})/);
                    const timeStr = timeMatch ? timeMatch[1] : '09:00';
                    
                    // Создаем объект Date с правильным временем для отображения
                    const date = new Date(request.desiredDate);
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    
                    // Устанавливаем часы и минуты
                    date.setHours(hours, minutes);
                    
                    return `Желаемая дата: ${formatDate(date)}`;
                  })()
              }
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {request.branch?.name || 'Филиал не указан'} - {request.section?.name || 'Секция не указана'}
            </span>
          </div>

          <div className="mt-2">
            <p className="text-sm font-medium">Контакты родителя:</p>
            <p className="text-sm">{request.parentName}</p>
            <p className="text-sm">{request.parentPhone}</p>
          </div>
          
          {/* Отображаем причины отказа, если статус REFUSED */}
          {request.status === TrialRequestStatus.REFUSED && request.notes && (
            <div className="mt-3 p-2 bg-muted/50 rounded-sm border-l-2 border-destructive">
              <p className="text-xs font-medium text-destructive mb-1">Причина отказа:</p>
              <p className="text-xs">{request.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}