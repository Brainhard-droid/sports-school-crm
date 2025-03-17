// AttendanceTable.tsx
import { format } from "date-fns";
import { ru } from "date-fns/locale";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Check, X, MoreVertical, MessageCircle, Trash2 } from "lucide-react";
import { Student, AttendanceStatus, DateComment } from "@shared/schema";

export interface AttendanceTableProps {
  students: Student[];
  scheduleDates: Date[];
  dateComments: DateComment[];
  loadingCell: string | null;
  onMarkAttendance: (studentId: number, date: Date) => void;
  onBulkAttendance: (date: Date, status: keyof typeof AttendanceStatus) => void;
  onCommentClick: (date: Date, existingComment?: DateComment) => void;
  onDeleteComment: (date: Date, comment: DateComment) => void;
  getAttendanceStatus: (studentId: number, date: Date) => keyof typeof AttendanceStatus | "NOT_MARKED";
}

export function AttendanceTable({
  students,
  scheduleDates,
  dateComments,
  loadingCell,
  onMarkAttendance,
  onBulkAttendance,
  onCommentClick,
  onDeleteComment,
  getAttendanceStatus,
}: AttendanceTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="min-w-[200px] border-r sticky left-0 bg-background">
              Ученик
            </TableHead>
            {scheduleDates.map((date) => {
              const dateComment = dateComments.find(
                (c) =>
                  format(new Date(c.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
              );
              return (
                <TableHead
                  key={date.toISOString()}
                  className="text-center border-r last:border-r-0 min-w-[100px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
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
                          <DropdownMenuItem
                            onClick={() => onBulkAttendance(date, "PRESENT")}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Отметить всех
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onBulkAttendance(date, "ABSENT")}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Отметить отсутствие
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onCommentClick(date, dateComment)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {dateComment ? "Изменить комментарий" : "Добавить комментарий"}
                          </DropdownMenuItem>
                          {dateComment && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => onDeleteComment(date, dateComment)}
                            >
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
                  </div>
                </TableHead>
              );
            })}
            <TableHead className="min-w-[100px] text-center border-l">
              Статистика
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id} className="border-b">
              <TableCell className="font-medium border-r sticky left-0 bg-background">
                {student.lastName} {student.firstName}
              </TableCell>
              {scheduleDates.map((date) => {
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
                    ) : status === "PRESENT" ? (
                      <Check className="h-4 w-4 mx-auto text-green-600" />
                    ) : status === "ABSENT" ? (
                      <X className="h-4 w-4 mx-auto text-red-600" />
                    ) : null}
                  </TableCell>
                );
              })}
              <TableCell className="text-center border-l">
                {/* Здесь можно вывести статистику посещаемости, если нужно */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
