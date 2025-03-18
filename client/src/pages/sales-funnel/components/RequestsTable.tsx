import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { format } from "date-fns";

interface RequestsTableProps {
  requests: ExtendedTrialRequest[];
  onStatusChange: (id: number, status: keyof typeof TrialRequestStatus) => void;
  onRequestClick: (request: ExtendedTrialRequest) => void;
}

export function RequestsTable({ requests, onStatusChange, onRequestClick }: RequestsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ФИО ребёнка</TableHead>
          <TableHead>Телефон родителя</TableHead>
          <TableHead>Секция</TableHead>
          <TableHead>Желаемая дата</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>{request.childName}</TableCell>
            <TableCell>{request.parentPhone}</TableCell>
            <TableCell>{request.section?.name}</TableCell>
            <TableCell>{format(new Date(request.desiredDate), "dd.MM.yyyy")}</TableCell>
            <TableCell>
              <Select
                value={request.status}
                onValueChange={(value) => 
                  onStatusChange(request.id, value as keyof typeof TrialRequestStatus)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TrialRequestStatus).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {getStatusLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Button variant="ghost" onClick={() => onRequestClick(request)}>
                Подробнее
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function getStatusLabel(status: string): string {
  switch (status) {
    case TrialRequestStatus.NEW:
      return "Новая";
    case TrialRequestStatus.TRIAL_ASSIGNED:
      return "Пробное назначено";
    case TrialRequestStatus.REFUSED:
      return "Отказ";
    case TrialRequestStatus.SIGNED:
      return "Записан";
    default:
      return status;
  }
}
