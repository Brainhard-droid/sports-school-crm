
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, X, Loader2, MessageSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Student, AttendanceStatus, DateComment } from "@shared/schema";

interface AttendanceTableProps {
  students: Student[];
  scheduleDates: Date[];
  dateComments: DateComment[];
  loadingCell: string | null;
  onMarkAttendance: (studentId: number, date: Date) => void;
  onCommentClick: (date: Date, comment?: DateComment) => void;
  getAttendanceStatus: (studentId: number, date: Date) => AttendanceStatus | null;
  onBulkAttendance: (date: Date, status: keyof typeof AttendanceStatus) => void;
}

export const AttendanceTable = ({
  students,
  scheduleDates,
  dateComments,
  loadingCell,
  onMarkAttendance,
  onCommentClick,
  getAttendanceStatus,
  onBulkAttendance,
}: AttendanceTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="border-r sticky left-0 bg-background">
              ФИО
            </TableHead>
            {scheduleDates?.map((date) => {
              const comment = dateComments?.find(
                (c) =>
                  format(new Date(c.date), "yyyy-MM-dd") ===
                  format(date, "yyyy-MM-dd")
              );
              
              return (
                <TableHead
                  key={date.toISOString()}
                  className="text-center border-r last:border-r-0 min-w-[100px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      {format(date, "d", { locale: ru })}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className={comment ? "text-primary" : "text-muted-foreground"}
                        onClick={() => onCommentClick(date, comment)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Отметить всех
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => onBulkAttendance(date, "PRESENT")}
                        >
                          Присутствовали
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onBulkAttendance(date, "ABSENT")}
                        >
                          Отсутствовали
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {students?.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium border-r sticky left-0 bg-background">
                {student.lastName} {student.firstName}
              </TableCell>
              {scheduleDates?.map((date) => {
                const status = getAttendanceStatus(student.id, date);
                const cellId = `${student.id}-${format(date, "yyyy-MM-dd")}`;
                const isLoading = loadingCell === cellId;

                return (
                  <TableCell
                    key={date.toISOString()}
                    className="text-center p-0 h-12 cursor-pointer hover:bg-muted/50 border-r last:border-r-0"
                    onClick={() => onMarkAttendance(student.id, date)}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mx-auto animate-spin" />
                    ) : status === AttendanceStatus.PRESENT ? (
                      <Check className="h-4 w-4 mx-auto text-green-600" />
                    ) : status === AttendanceStatus.ABSENT ? (
                      <X className="h-4 w-4 mx-auto text-red-600" />
                    ) : null}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
