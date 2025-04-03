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
}

export function TrialRequestCard({ request, onEdit, onAssignTrial }: TrialRequestCardProps) {
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
              {request.status === TrialRequestStatus.NEW && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAssignTrial(request)}>
                    Назначить пробное
                  </DropdownMenuItem>
                </>
              )}
              {request.status === TrialRequestStatus.TRIAL_ASSIGNED && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAssignTrial(request)}>
                    Перенести пробное
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Отменить пробное
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {request.scheduledDate
                ? `Пробное: ${formatDate(request.scheduledDate)}`
                : `Желаемая дата: ${formatDate(request.desiredDate)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{request.branch?.name} - {request.section?.name}</span>
          </div>

          <div className="mt-2">
            <p className="text-sm font-medium">Контакты родителя:</p>
            <p className="text-sm">{request.parentName}</p>
            <p className="text-sm">{request.parentPhone}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}