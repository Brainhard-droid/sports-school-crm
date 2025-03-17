import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MoreVertical, Check, X, MessageCircle, Trash2, Loader2 } from "lucide-react";
import { CommentDialog } from "./CommentDialog";
import { AttendanceStatus, DateComment, Student } from "@shared/schema";

interface AttendanceTableProps {
  scheduleDates: Date[];
  students: Student[];
  attendance: any[];
  dateComments: DateComment[];
  loadingCell: string | null;
  handleMarkAttendance: (studentId: number, date: Date) => void;
  handleBulkAttendance: (date: Date, status: keyof typeof AttendanceStatus) => void;
  setCommentDialogData: (data: { isOpen: boolean; date: Date; comment?: DateComment }) => void;
  getAttendanceStatus: (studentId: number, date: Date) => keyof typeof AttendanceStatus;
  getStudentStats: (studentId: number) => { attended: number; totalClasses: number; percentage: number };
}

export const AttendanceTable = ({
  scheduleDates = [],
  students = [],
  attendance = [],
  dateComments = [],
  loadingCell,
  handleMarkAttendance,
  handleBulkAttendance,
  setCommentDialogData,
  getAttendanceStatus,
  getStudentStats,
}: AttendanceTableProps) => {
  if (!scheduleDates?.length) {
    return (
      <div className="text-center p-4">
        Нет данных о расписании для выбранного месяца
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b">
          <TableHead className="min-w-[200px] border-r">Ученик</TableHead>
          {scheduleDates.map((date) => {
            const dateComment = dateComments?.find(
              (c) => format(new Date(c.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
            );

            return (
              <TableHead
                key={date.toISOString()}
                className="text-center min-w-[40px] border-r last:border-r-0"
              >
                <div className="flex items-center justify-center gap-1">
                  <div>
                    <div>{format(date, "d")}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(date, "EEE", { locale: ru })}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAttendance(date, "PRESENT")}>
                        <Check className="h-4 w-4 mr-2" />
                        Отметить всех
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAttendance(date, "ABSENT")}>
                        <X className="h-4 w-4 mr-2" />
                        Отметить отсутствие
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCommentDialogData({ isOpen: true, date, comment: dateComment })}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {dateComment ? "Изменить комментарий" : "Добавить комментарий"}
                      </DropdownMenuItem>
                      {dateComment && (
                        <DropdownMenuItem onClick={() => setCommentDialogData({ isOpen: true, date, comment: undefined })}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить комментарий
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {dateComment && (
                  <Tooltip>
                    <TooltipTrigger>
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{dateComment.comment}</TooltipContent>
                  </Tooltip>
                )}
              </TableHead>
            );
          })}
          <TableHead className="min-w-[100px] text-center border-l">Статистика</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => {
          const stats = getStudentStats(student.id);
          const lowAttendance = stats.percentage < 50;

          return (
            <TableRow key={student.id} className="border-b">
              <TableCell className="font-medium border-r">{student.lastName} {student.firstName}</TableCell>
              {scheduleDates.map((date) => {
                const status = getAttendanceStatus(student.id, date);
                const cellId = `${student.id}-${format(date, "yyyy-MM-dd")}`;
                const isLoading = loadingCell === cellId;
                return (
                  <TableCell
                    key={date.toISOString()}
                    className="text-center p-0 h-12 cursor-pointer hover:bg-muted/50 border-r last:border-r-0"
                    onClick={() => handleMarkAttendance(student.id, date)}
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
              <TableCell className={`text-center border-l ${lowAttendance ? 'text-red-600' : ''}`}>
                {stats.percentage}% ({stats.attended}/{stats.totalClasses})
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default AttendanceTable;