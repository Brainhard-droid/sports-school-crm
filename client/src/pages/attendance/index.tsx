import { useState } from "react";
import { Layout } from "@/components/layout/navbar";
import { useGroups } from "./hooks/useGroups";
import { useStudents } from "./hooks/useStudents";
import { useSchedule } from "./hooks/useSchedule";
import { useComments } from "./hooks/useComments";
import GroupsList from "./components/GroupsList";
import { AttendanceTable } from "./components/AttendanceTable";
import AttendanceControls from "./components/AttendanceControls";
import ExportAttendance from "./components/ExportAttendance";
import CommentDialog from "./components/CommentDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { AttendanceStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { useAttendance } from "./hooks/useAttendance";

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [loadingCell, setLoadingCell] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [commentDialogData, setCommentDialogData] = useState<{
    isOpen: boolean;
    date: Date | null;
    comment?: any;
  }>({ isOpen: false, date: null });

  const { toast } = useToast();
  const { groups } = useGroups();
  const { students } = useStudents(selectedGroup);
  const { scheduleDates, isLoading: isLoadingSchedule } = useSchedule(
    selectedGroup,
    selectedMonth.getMonth() + 1,
    selectedMonth.getFullYear()
  );
  const { attendance, isLoading: isLoadingAttendance, markAttendanceMutation } = useAttendance(
    selectedGroup,
    selectedMonth.getMonth() + 1,
    selectedMonth.getFullYear()
  );
  const { dateComments, isLoading: isLoadingComments, commentMutation } = useComments(
    selectedGroup,
    selectedMonth.getMonth() + 1,
    selectedMonth.getFullYear()
  );

  const handleMarkAttendance = async (studentId: number, date: Date) => {
    if (!selectedGroup) return;

    const cellId = `${studentId}-${format(date, "yyyy-MM-dd")}`;
    setLoadingCell(cellId);

    try {
      let nextStatus: keyof typeof AttendanceStatus;
      const currentStatus = getAttendanceStatus(studentId, date);

      // Меняем последовательность на: пусто -> галочка -> крестик -> пусто
      switch (currentStatus) {
        case AttendanceStatus.NOT_MARKED:
          nextStatus = AttendanceStatus.PRESENT;
          break;
        case AttendanceStatus.PRESENT:
          nextStatus = AttendanceStatus.ABSENT;
          break;
        case AttendanceStatus.ABSENT:
          nextStatus = AttendanceStatus.NOT_MARKED;
          break;
        default:
          nextStatus = AttendanceStatus.NOT_MARKED;
      }

      await markAttendanceMutation.mutateAsync({
        studentId,
        groupId: selectedGroup,
        date: format(date, "yyyy-MM-dd"),
        status: nextStatus
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

  const handleCommentAction = async (data: { 
    date: Date, 
    comment?: any, 
    action?: 'delete' 
  }) => {
    if (!selectedGroup) return;

    if (data.action === 'delete' && data.comment?.id) {
      try {
        await commentMutation.mutateAsync({
          groupId: selectedGroup,
          date: format(data.date, "yyyy-MM-dd"),
          commentId: data.comment.id,
          action: 'delete'
        });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить комментарий",
          variant: "destructive",
        });
      }
    } else {
      setCommentDialogData({ 
        isOpen: true, 
        date: data.date, 
        comment: data.comment 
      });
    }
  };

  const handleSaveComment = async (comment: string) => {
    if (!selectedGroup || !commentDialogData.date) return;

    try {
      await commentMutation.mutateAsync({
        groupId: selectedGroup,
        date: format(commentDialogData.date, "yyyy-MM-dd"),
        comment,
        commentId: commentDialogData.comment?.id
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

  const handleBulkAttendance = async (date: Date, status: keyof typeof AttendanceStatus) => {
    if (!selectedGroup || !students) return;

    try {
      // Обновляем статус для каждого студента
      await Promise.all(
        students.map(student => 
          markAttendanceMutation.mutateAsync({
            studentId: student.id,
            groupId: selectedGroup,
            date: format(date, "yyyy-MM-dd"),
            status
          })
        )
      );

      toast({
        title: "Успешно",
        description: "Посещаемость обновлена для всех студентов",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить посещаемость",
        variant: "destructive",
      });
    }
  };

  const getAttendanceStatus = (studentId: number, date: Date): keyof typeof AttendanceStatus => {
    const record = attendance?.find(
      (a) => 
        a.studentId === studentId && 
        format(new Date(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
    return record?.status || AttendanceStatus.NOT_MARKED;
  };

  const isLoading = isLoadingSchedule || isLoadingAttendance || isLoadingComments;

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Посещаемость</h1>
        <GroupsList
          groups={groups || []}
          selectedGroupId={selectedGroup || undefined}
          onSelectGroup={setSelectedGroup}
        />

        {selectedGroup && (
          <Dialog open modal onOpenChange={() => setSelectedGroup(null)}>
            <DialogContent className="max-w-[95vw] w-fit">
              <DialogHeader>
                <DialogTitle>
                  {groups?.find(g => g.id === selectedGroup)?.name}
                </DialogTitle>
              </DialogHeader>

              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <AttendanceControls
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                  />
                  <ExportAttendance handleExport={() => {}} />
                  <AttendanceTable
                    scheduleDates={scheduleDates}
                    students={students || []}
                    attendance={attendance}
                    dateComments={dateComments}
                    loadingCell={loadingCell}
                    handleMarkAttendance={handleMarkAttendance}
                    handleBulkAttendance={handleBulkAttendance}
                    setCommentDialogData={handleCommentAction}
                    getAttendanceStatus={getAttendanceStatus}
                    getStudentStats={(studentId) => {
                      const studentAttendance = attendance?.filter(a => a.studentId === studentId) || [];
                      const totalClasses = scheduleDates?.length || 0;
                      const attended = studentAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
                      const percentage = totalClasses ? Math.round((attended / totalClasses) * 100) : 0;
                      return { attended, totalClasses, percentage };
                    }}
                  />
                </>
              )}

              {commentDialogData.isOpen && commentDialogData.date && !commentDialogData.comment?.action && (
                <CommentDialog
                  isOpen={commentDialogData.isOpen}
                  onClose={() => setCommentDialogData({ isOpen: false, date: null })}
                  date={commentDialogData.date}
                  groupId={selectedGroup}
                  existingComment={commentDialogData.comment}
                  onSave={handleSaveComment}
                />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}