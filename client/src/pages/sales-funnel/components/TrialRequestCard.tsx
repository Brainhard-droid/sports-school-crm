import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, MapPin } from "lucide-react";
import { ExtendedTrialRequest } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface TrialRequestCardProps {
  request: ExtendedTrialRequest;
  onAssignTrial: (request: ExtendedTrialRequest) => void;
  onEdit: (request: ExtendedTrialRequest) => void;
}

export function TrialRequestCard({ request, onAssignTrial, onEdit }: TrialRequestCardProps) {
  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold">{request.childName}</h3>
            <p className="text-sm text-muted-foreground">{request.childAge} лет</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(request)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {request.status === "NEW" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onAssignTrial(request)}
              >
                Назначить пробное
              </Button>
            )}
          </div>
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
