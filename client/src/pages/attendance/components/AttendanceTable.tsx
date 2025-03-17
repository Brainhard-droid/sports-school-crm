import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Group, Student, AttendanceStatus, DateComment } from "@shared/schema";
import { useAttendance } from "../hooks/useAttendance";
import { useComments } from "../hooks/useComments";
import { CommentDialog } from "./CommentDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  X,
  Check,
  Loader2,
  Download,
  MoreVertical,
  MessageCircle,
  Trash2,
} from "lucide-react";

interface AttendanceTableProps {
  group: Group;
  onClose: () => void;
}

export function AttendanceTable({ group, onClose }: AttendanceTableProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingCell, setLoadingCell] = useState<string | null>(null);
  const [commentDialogData, setCommentDialogData] = useState<{
    isOpen: boolean;
    date: Date | null;
    comment?: DateComment;
  }>({ isOpen: false, date: null });

  // Custom hooks
  const { attendance, markAttendance, bulkAttendance, isLoading: isLoadingAttendance } = useAttendance({
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

  // Handle date navigation
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

  // Get all dates of the selected month that have schedules
  const getDatesInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates: Date[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      // Check if this date has a schedule
      const dayOfWeek = date.getDay() || 7; // Convert Sunday (0) to 7
      if (group.schedules?.some(schedule => schedule.dayOfWeek === dayOfWeek)) {
        dates.push(date);
      }
    }

    return dates;
  };

  const scheduleDates = getDatesInMonth();

  // Handle attendance marking
  const handleAttendanceClick = async (
    studentId: number,
    date: Date,
    currentStatus?: keyof typeof AttendanceStatus
  ) => {
    const cellId = `${studentId}-${format(date, "yyyy-MM-dd")}`;
    setLoadingCell(cellId);

    try {
      const nextStatus = !currentStatus || currentStatus === "ABSENT" 
        ? "PRESENT" 
        : "ABSENT";

      await markAttendance({
        studentId,
        date,
        status: nextStatus,
      });
    } finally {
      setLoadingCell(null);
    }
  };

  // Handle bulk attendance
  const handleBulkAttendance = async (date: Date, status: keyof typeof AttendanceStatus) => {
    await bulkAttendance({
      date,
      status,
    });
  };

  // Handle comment management
  const handleCommentClick = (date: Date, existingComment?: DateComment) => {
    setCommentDialogData({
      isOpen: true,
      date,
      comment: existingComment,
    });
  };

  const handleSaveComment = async (comment: string) => {
    if (!commentDialogData.date) return;

    await manageComment({
      date: commentDialogData.date,
      comment,
      commentId: commentDialogData.comment?.id,
    });

    setCommentDialogData({ isOpen: false, date: null });
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: number) => {
    await manageComment({
      date: new Date(), // Unused in delete operation
      comment: "", // Unused in delete operation
      commentId,
      action: "delete"
    });
  };

  // Get attendance status for a student on a specific date
  const getAttendanceStatus = (studentId: number, date: Date) => {
    return attendance.find(
      a => 
        a.studentId === studentId && 
        format(new Date(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    )?.status;
  };

  // Get comment for a specific date
  const getDateComment = (date: Date) => {
    return comments.find(
      c => format(new Date(c.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  if (isLoadingAttendance || isLoadingComments) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Посещаемость группы {group.name}</span>
            <DialogClose />
          </DialogTitle>
        </DialogHeader>

        {/* Header Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium">
              {format(selectedMonth, "LLLL yyyy", { locale: ru })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
            >
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
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Студент</TableHead>
                {scheduleDates.map((date) => (
                  <TableHead key={date.toISOString()} className="text-center">
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
                              onClick={() => handleBulkAttendance(date, "PRESENT")}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Отметить всех
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleBulkAttendance(date, "ABSENT")}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    {student.lastName} {student.firstName}
                  </TableCell>
                  {scheduleDates.map((date) => {
                    const cellId = `${student.id}-${format(date, "yyyy-MM-dd")}`;
                    const status = getAttendanceStatus(student.id, date);
                    return (
                      <TableCell
                        key={date.toISOString()}
                        className="text-center"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleAttendanceClick(student.id, date, status)}
                          disabled={!!loadingCell}
                        >
                          {loadingCell === cellId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : status === "PRESENT" ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : status === "ABSENT" ? (
                            <X className="h-4 w-4 text-red-500" />
                          ) : null}
                        </Button>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Comment Dialog */}
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