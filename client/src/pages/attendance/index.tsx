import { useState } from "react";
import { useGroups } from "./hooks/useGroups";
import { useStudents } from "./hooks/useStudents";
import { useSchedule } from "./hooks/useSchedule";
import { useComments } from "./hooks/useComments";
import GroupsList from "./components/GroupsList";
import CommentDialog from "./components/CommentDialog";
import AttendanceContent from "./components/AttendanceContent";
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
  const { students } = useStudents(selectedGroup || undefined);
  const { scheduleDates, isLoading: isLoadingSchedule } = useSchedule(
    selectedGroup || undefined,
    selectedMonth.getMonth() + 1,
    selectedMonth.getFullYear()
  );
  const { attendance, isLoading: isLoadingAttendance, markAttendanceMutation } = useAttendance(
    selectedGroup || undefined,
    selectedMonth.getMonth() + 1,
    selectedMonth.getFullYear()
  );
  const { dateComments, isLoading: isLoadingComments, commentMutation } = useComments(
    selectedGroup || undefined,
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
          comment: "", // Пустой комментарий для удаления
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
    
    // Проверка на допустимые значения из AttendanceStatus
    if (!record?.status) return AttendanceStatus.NOT_MARKED;
    
    switch (record.status) {
      case AttendanceStatus.PRESENT:
        return AttendanceStatus.PRESENT;
      case AttendanceStatus.ABSENT:
        return AttendanceStatus.ABSENT;
      default:
        return AttendanceStatus.NOT_MARKED;
    }
  };

  const isLoading = isLoadingSchedule || isLoadingAttendance || isLoadingComments;
  const selectedGroupName = groups?.find(g => g.id === selectedGroup)?.name || "";

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Посещаемость</h1>
      
      <div className="mb-6">
        <GroupsList
          groups={groups || []}
          selectedGroupId={selectedGroup || undefined}
          onSelectGroup={setSelectedGroup}
        />
      </div>

      {!selectedGroup && (
        <div className="text-center p-12 text-muted-foreground border rounded-lg">
          Выберите группу для просмотра посещаемости
        </div>
      )}

      {selectedGroup && (
        <AttendanceContent 
          isLoading={isLoading}
          scheduleDates={scheduleDates || []}
          students={students || []}
          attendance={attendance || []}
          dateComments={dateComments || []}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          loadingCell={loadingCell}
          groupName={selectedGroupName}
          handleMarkAttendance={handleMarkAttendance}
          handleBulkAttendance={handleBulkAttendance}
          handleCommentAction={handleCommentAction}
          getAttendanceStatus={getAttendanceStatus}
        />
      )}

      {commentDialogData.isOpen && commentDialogData.date && !commentDialogData.comment?.action && (
        <CommentDialog
          isOpen={commentDialogData.isOpen}
          onClose={() => setCommentDialogData({ isOpen: false, date: null })}
          date={commentDialogData.date}
          groupId={selectedGroup!}
          existingComment={commentDialogData.comment}
          onSave={handleSaveComment}
        />
      )}
    </div>
  );
}