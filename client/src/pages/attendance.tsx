import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout/navbar";
import { Student, Group, Attendance, AttendanceStatus, DateComment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Loader2,
  Download,
  MoreVertical,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Add comment dialog component
const CommentDialog = ({
  isOpen,
  onClose,
  date,
  groupId,
  existingComment,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  groupId: number;
  existingComment?: DateComment;
  onSave: (comment: string) => void;
}) => {
  const [comment, setComment] = useState(existingComment?.comment || "");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Комментарий к {format(date, "d MMMM yyyy", { locale: ru })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Введите комментарий..."
          />
          <Button onClick={() => onSave(comment)}>Сохранить</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loadingCell, setLoadingCell] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [commentDialogData, setCommentDialogData] = useState<{
    isOpen: boolean;
    date: Date | null;
    comment?: DateComment;
  }>({ isOpen: false, date: null });
  const { toast } = useToast();

  // Get active groups
  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  // Get schedule dates for selected group and month
  const { data: scheduleDates } = useQuery<Date[]>({
    queryKey: [
      "/api/groups",
      selectedGroup?.id,
      "schedule-dates",
      selectedMonth.getMonth() + 1,
      selectedMonth.getFullYear(),
    ],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const res = await apiRequest(
        "GET",
        `/api/groups/${selectedGroup.id}/schedule-dates?month=${
          selectedMonth.getMonth() + 1
        }&year=${selectedMonth.getFullYear()}`
      );
      const dates = await res.json();
      return dates.map((d: string) => new Date(d));
    },
    enabled: !!selectedGroup,
  });

  // Get students in selected group
  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/group-students", selectedGroup?.id],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const res = await apiRequest("GET", `/api/group-students/${selectedGroup.id}`);
      return res.json();
    },
    enabled: !!selectedGroup,
  });

  // Get attendance records for selected month
  const { data: attendance } = useQuery<Attendance[]>({
    queryKey: [
      "/api/attendance",
      selectedGroup?.id,
      selectedMonth.getMonth() + 1,
      selectedMonth.getFullYear(),
    ],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const res = await apiRequest(
        "GET",
        `/api/attendance?groupId=${selectedGroup.id}&month=${
          selectedMonth.getMonth() + 1
        }&year=${selectedMonth.getFullYear()}`
      );
      return res.json();
    },
    enabled: !!selectedGroup,
  });

  // Add query for date comments
  const { data: dateComments } = useQuery<DateComment[]>({
    queryKey: [
      "/api/date-comments",
      selectedGroup?.id,
      selectedMonth.getMonth() + 1,
      selectedMonth.getFullYear(),
    ],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const res = await apiRequest(
        "GET",
        `/api/date-comments?groupId=${selectedGroup.id}&month=${
          selectedMonth.getMonth() + 1
        }&year=${selectedMonth.getFullYear()}`
      );
      return res.json();
    },
    enabled: !!selectedGroup,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({
      studentId,
      date,
      status,
    }: {
      studentId: number;
      date: Date;
      status: keyof typeof AttendanceStatus;
    }) => {
      const existingAttendance = attendance?.find(
        (a) =>
          a.studentId === studentId &&
          format(new Date(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      );

      if (existingAttendance) {
        // Update existing attendance record
        const res = await apiRequest("PATCH", `/api/attendance/${existingAttendance.id}`, {
          status,
        });
        return res.json();
      } else {
        // Create new attendance record
        const newAttendance = {
          studentId,
          groupId: selectedGroup!.id,
          date: format(date, "yyyy-MM-dd"),
          status,
        };
        const res = await apiRequest("POST", "/api/attendance", newAttendance);
        return res.json();
      }
    },
    onSuccess: () => {
      setLoadingCell(null);
      queryClient.invalidateQueries({
        queryKey: [
          "/api/attendance",
          selectedGroup?.id,
          selectedMonth.getMonth() + 1,
          selectedMonth.getFullYear(),
        ],
      });
    },
    onError: (error) => {
      console.error('Error marking attendance:', error);
      setLoadingCell(null);
      toast({
        title: "Ошибка",
        description: "Не удалось отметить посещаемость",
        variant: "destructive",
      });
    },
  });

  // Add mutation for date comments
  const dateCommentMutation = useMutation({
    mutationFn: async (data: { 
      groupId: number; 
      date: string; 
      comment: string;
      commentId?: number; 
    }) => {
      if (data.commentId) {
        // Update existing comment
        console.log('Updating comment:', data.commentId, data.comment);
        const res = await apiRequest(
          "PATCH", 
          `/api/date-comments/${data.commentId}`, 
          { comment: data.comment }
        );
        if (!res.ok) {
          throw new Error('Failed to update comment');
        }
        return res.json();
      } else {
        // Create new comment
        console.log('Creating new comment');
        const res = await apiRequest("POST", "/api/date-comments", {
          groupId: data.groupId,
          date: data.date,
          comment: data.comment
        });
        if (!res.ok) {
          throw new Error('Failed to create comment');
        }
        return res.json();
      }
    },
    onSuccess: () => {
      // Force refetch instead of just invalidating
      queryClient.refetchQueries({
        queryKey: [
          "/api/date-comments",
          selectedGroup?.id,
          selectedMonth.getMonth() + 1,
          selectedMonth.getFullYear(),
        ],
        exact: true,
      });
      setCommentDialogData({ isOpen: false, date: null });
      toast({
        title: "Успешно",
        description: commentDialogData.comment?.id 
          ? "Комментарий обновлен" 
          : "Комментарий сохранен",
      });
    },
    onError: (error) => {
      console.error('Error saving comment:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить комментарий",
        variant: "destructive",
      });
    },
  });

  // Add mutation for bulk attendance
  const bulkAttendanceMutation = useMutation({
    mutationFn: async (data: {
      groupId: number;
      date: string;
      status: keyof typeof AttendanceStatus;
    }) => {
      const res = await apiRequest("POST", "/api/attendance/bulk", data);
      if (!res.ok) throw new Error('Failed to update bulk attendance');
      return res.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ // Заменяем invalidateQueries на refetchQueries
        queryKey: [
          "/api/attendance",
          selectedGroup?.id,
          selectedMonth.getMonth() + 1,
          selectedMonth.getFullYear(),
        ],
        exact: true,
      });
      toast({
        title: "Успешно",
        description: "Посещаемость обновлена",
      });
    },
  });

  const handleMarkAttendance = (studentId: number, date: Date) => {
    if (!selectedGroup) return;

    const cellId = `${studentId}-${format(date, "yyyy-MM-dd")}`;
    setLoadingCell(cellId);

    const existingAttendance = attendance?.find(
      (a) =>
        a.studentId === studentId &&
        format(new Date(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );

    let nextStatus: keyof typeof AttendanceStatus;
    if (!existingAttendance || existingAttendance.status === AttendanceStatus.NOT_MARKED) {
      nextStatus = "PRESENT";
    } else if (existingAttendance.status === AttendanceStatus.PRESENT) {
      nextStatus = "ABSENT";
    } else {
      nextStatus = "NOT_MARKED";
    }

    markAttendanceMutation.mutate({ studentId, date, status: nextStatus });
  };

  const handleSaveComment = async (comment: string) => {
    if (!selectedGroup || !commentDialogData.date) return;

    try {
      await dateCommentMutation.mutateAsync({
        groupId: selectedGroup.id,
        date: format(commentDialogData.date, "yyyy-MM-dd"),
        comment,
        commentId: commentDialogData.comment?.id,
      });
    } catch (error) {
      console.error('Error in handleSaveComment:', error);
    }
  };

  const handleBulkAttendance = async (date: Date, status: keyof typeof AttendanceStatus) => {
    if (!selectedGroup) return;

    await bulkAttendanceMutation.mutate({
      groupId: selectedGroup.id,
      date: format(date, "yyyy-MM-dd"),
      status,
    });
  };

  const getAttendanceStatus = (studentId: number, date: Date) => {
    const record = attendance?.find(
      (a) =>
        a.studentId === studentId &&
        format(new Date(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );

    return record?.status || AttendanceStatus.NOT_MARKED;
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)));
  };

  // Calculate attendance statistics for a student
  const getStudentStats = (studentId: number) => {
    const studentAttendance = attendance?.filter(a => a.studentId === studentId) || [];
    const totalClasses = scheduleDates?.length || 0;
    const attended = studentAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const percentage = totalClasses ? Math.round((attended / totalClasses) * 100) : 0;
    return { attended, totalClasses, percentage };
  };

  // Calculate group statistics
  const getGroupStats = () => {
    if (!students?.length || !scheduleDates?.length) return { averageAttendance: 0 };

    const totalStudents = students.length;
    const totalClasses = scheduleDates.length;
    const totalPossibleAttendances = totalStudents * totalClasses;

    const totalPresent = attendance?.filter(a => a.status === AttendanceStatus.PRESENT).length || 0;
    const averageAttendance = Math.round((totalPresent / totalPossibleAttendances) * 100);

    return { averageAttendance };
  };

  // Filter students
  const filteredStudents = students?.filter(student => {
    const fullName = `${student.lastName} ${student.firstName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Export with format selection
  const handleExport = (format: 'csv' | 'pdf') => {
    if (!students || !scheduleDates || !selectedGroup) return;

    if (format === 'csv') {
      const headers = [
        "Ученик",
        ...scheduleDates.map(date => format(date, "d MMM (EEE)", { locale: ru })),
        "Посещаемость"
      ];

      const rows = students.map(student => {
        const stats = getStudentStats(student.id);
        return [
          `${student.lastName} ${student.firstName}`,
          ...scheduleDates.map(date => {
            const status = getAttendanceStatus(student.id, date);
            return status === AttendanceStatus.PRESENT ? "✓" :
              status === AttendanceStatus.ABSENT ? "×" : "";
          }),
          `${stats.percentage}% (${stats.attended}/${stats.totalClasses})`
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${selectedGroup.name}-${format(selectedMonth, "yyyy-MM")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      // PDF export logic would go here
      toast({
        title: "В разработке",
        description: "Экспорт в PDF будет доступен в ближайшее время",
      });
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Посещаемость</h1>

        {/* Groups List */}
        <div className="space-y-2 mb-6">
          {groups
            ?.filter((g) => g.active)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((group) => (
              <Button
                key={group.id}
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => setSelectedGroup(group)}
              >
                {group.name}
              </Button>
            ))}
        </div>

        {/* Attendance Modal */}
        <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
          <DialogContent className="max-w-[95vw] w-fit">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{selectedGroup?.name}</DialogTitle>
                <DialogClose />
              </div>
            </DialogHeader>

            {/* Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
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
                <Input
                  placeholder="Поиск по имени..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-[200px]"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Средняя посещаемость: <span className="font-medium">{getGroupStats().averageAttendance}%</span>
                </div>
                {/* Export dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Экспорт
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      Excel (CSV)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="min-w-[200px] border-r">Ученик</TableHead>
                    {scheduleDates?.map((date) => {
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
                                  Отметить отсутствие
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setCommentDialogData({
                                    isOpen: true,
                                    date,
                                    comment: dateComment,
                                  })}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  {dateComment ? "Изменить комментарий" : "Добавить комментарий"}
                                </DropdownMenuItem>
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
                    <TableHead className="min-w-[100px] text-center border-l">
                      Статистика
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents
                    ?.sort((a, b) =>
                      `${a.lastName} ${a.firstName}`.localeCompare(
                        `${b.lastName} ${b.firstName}`
                      )
                    )
                    .map((student) => {
                      const stats = getStudentStats(student.id);
                      const lowAttendance = stats.percentage < 50;

                      return (
                        <TableRow key={student.id} className="border-b">
                          <TableCell className="font-medium border-r">
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
                            className={`text-center border-l ${
                              lowAttendance ? 'text-red-600' : ''
                            }`}
                          >
                            {stats.percentage}% ({stats.attended}/{stats.totalClasses})
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>

            {/* Comment Dialog */}
            {commentDialogData.isOpen && commentDialogData.date && (
              <CommentDialog
                isOpen={commentDialogData.isOpen}
                onClose={() => setCommentDialogData({ isOpen: false, date: null })}
                date={commentDialogData.date}
                groupId={selectedGroup?.id || 0}
                existingComment={commentDialogData.comment}
                onSave={handleSaveComment}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}