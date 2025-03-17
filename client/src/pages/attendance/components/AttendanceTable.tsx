import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AttendanceStatus, DateComment, ExtendedGroup } from "@shared/schema";
import { useAttendanceData } from "../hooks/useAttendanceData";
import { useComments } from "../hooks/useComments";
import { CommentDialog } from "./CommentDialog";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  MoreVertical,
  MessageCircle,
  Trash2,
  Download,
  Loader2,
} from "lucide-react";

interface AttendanceTableProps {
  group: ExtendedGroup;
  onClose: () => void;
}

export function AttendanceTable({ group, onClose }: AttendanceTableProps) {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingCell, setLoadingCell] = useState<string | null>(null);
  const [commentDialogData, setCommentDialogData] = useState<{
    isOpen: boolean;
    date: Date | null;
    comment?: DateComment;
  }>({ isOpen: false, date: null });

  const { attendance, markAttendance, bulkAttendance, calculateStatistics, isLoading: isLoadingAttendance } = useAttendanceData({
    groupId: group.id,
    month: selectedMonth,
  });

  const { comments, manageComment, isLoading: isLoadingComments } = useComments({
    groupId: group.id,
    month: selectedMonth,
  });

  // Filter students based on search term
  const filteredStudents = group.students?.filter(student =>
    `${student.lastName} ${student.firstName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) || [];

  // Get schedule dates from API data in attendance records
  const getScheduleDates = () => {
    if (!attendance.length) return [];

    const uniqueDates = [...new Set(attendance.map(a => format(new Date(a.date), "yyyy-MM-dd")))];
    return uniqueDates
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime())
      .filter(date => {
        const monthMatch = date.getMonth() === selectedMonth.getMonth() && 
                         date.getFullYear() === selectedMonth.getFullYear();
        return monthMatch;
      });
  };

  const scheduleDates = getScheduleDates();

  // Navigation handlers
  const handlePreviousMonth = () => {
    setSelectedMonth(prevMonth => {
      const newDate = new Date(prevMonth);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth(prevMonth => {
      const newDate = new Date(prevMonth);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Get attendance status for a student on a specific date
  const getAttendanceStatus = (studentId: number, date: Date) => {
    return attendance.find(
      a => 
        a.studentId === studentId && 
        format(new Date(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    )?.status || AttendanceStatus.NOT_MARKED;
  };

  // Get comment for a specific date
  const getDateComment = (date: Date) => {
    return comments.find(
      c => format(new Date(c.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  const handleMarkAttendance = async (studentId: number, date: Date) => {
    const cellId = `${studentId}-${format(date, "yyyy-MM-dd")}`;
    setLoadingCell(cellId);

    try {
      const currentStatus = getAttendanceStatus(studentId, date);
      let nextStatus: keyof typeof AttendanceStatus;

      if (currentStatus === AttendanceStatus.NOT_MARKED) {
        nextStatus = AttendanceStatus.PRESENT;
      } else if (currentStatus === AttendanceStatus.PRESENT) {
        nextStatus = AttendanceStatus.ABSENT;
      } else {
        nextStatus = AttendanceStatus.NOT_MARKED;
      }

      await markAttendance({
        studentId,
        date,
        status: nextStatus,
      });

      toast({
        title: "Успешно",
        description: "Посещаемость обновлена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить посещаемость",
        variant: "destructive",
      });
    } finally {
      setLoadingCell(null);
    }
  };

  const handleCommentClick = (date: Date, existingComment?: DateComment) => {
    setCommentDialogData({
      isOpen: true,
      date,
      comment: existingComment,
    });
  };

  const handleSaveComment = async (comment: string) => {
    if (!commentDialogData.date) return;

    try {
      await manageComment({
        date: commentDialogData.date,
        comment,
        commentId: commentDialogData.comment?.id,
      });
      setCommentDialogData({ isOpen: false, date: null });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить комментарий",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await manageComment({
        date: new Date(),
        comment: "",
        commentId,
        action: "delete"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить комментарий",
        variant: "destructive",
      });
    }
  };

  const handleBulkAttendance = async (date: Date, status: keyof typeof AttendanceStatus) => {
    try {
      await bulkAttendance({
        date,
        status,
      });
      toast({
        title: "Успешно",
        description: "Посещаемость обновлена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить посещаемость",
        variant: "destructive",
      });
    }
  };

  if (isLoadingAttendance || isLoadingComments) {
    return (
      <Dialog open modal onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: "В разработке",
      description: "Функция экспорта будет доступна в ближайшее время",
    });
  };

  return (
    <Dialog open modal onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-fit">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Посещаемость группы {group.name}</DialogTitle>
            <DialogClose />
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium min-w-[140px] text-center">
              {format(selectedMonth, "LLLL yyyy", { locale: ru })}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Поиск по имени..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px] sticky left-0 bg-background">Студент</TableHead>
                {scheduleDates.map((date) => (
                  <TableHead key={date.toISOString()} className="text-center min-w-[40px]">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        {format(date, "d", { locale: ru })}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem 
                              onClick={() => handleBulkAttendance(date, AttendanceStatus.PRESENT)}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Отметить всех
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleBulkAttendance(date, AttendanceStatus.ABSENT)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Снять отметки
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-1">
                        {getDateComment(date) ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCommentClick(date, getDateComment(date))}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="flex items-center gap-2">
                                <span>{getDateComment(date)?.comment}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    const comment = getDateComment(date);
                                    if (comment) handleDeleteComment(comment.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCommentClick(date)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center min-w-[100px] sticky right-0 bg-background">
                  Статистика
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents
                .sort((a, b) => 
                  `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
                )
                .map((student) => {
                  const stats = calculateStatistics(student.id);
                  const lowAttendance = stats.percentage < 50;

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium sticky left-0 bg-background">
                        {student.lastName} {student.firstName}
                      </TableCell>
                      {scheduleDates.map((date) => {
                        const cellId = `${student.id}-${format(date, "yyyy-MM-dd")}`;
                        const status = getAttendanceStatus(student.id, date);
                        const isLoading = loadingCell === cellId;

                        return (
                          <TableCell
                            key={date.toISOString()}
                            className="text-center p-0 h-12 cursor-pointer hover:bg-muted/50"
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
                      <TableCell
                        className={`text-center sticky right-0 bg-background ${
                          lowAttendance ? "text-red-600" : ""
                        }`}
                      >
                        {stats.formatted}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>

        {commentDialogData.isOpen && commentDialogData.date && (
          <CommentDialog
            isOpen={true}
            onClose={() => setCommentDialogData({ isOpen: false, date: null })}
            date={commentDialogData.date}
            existingComment={commentDialogData.comment}
            onSave={handleSaveComment}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}