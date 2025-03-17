// index.tsx
import { useState } from "react";
import { Layout } from "@/components/layout/navbar";
import { Group } from "@shared/schema";
import { GroupsList } from "./components/GroupsList";
import { AttendanceTable } from "./components/AttendanceTable";
import { CommentDialog } from "./components/CommentDialog";
import { useGroups } from "./hooks/useGroups";
import { useAttendanceData } from "./hooks/useAttendanceData";
import { useAttendanceMutations } from "./hooks/useAttendanceMutations";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function AttendancePage() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loadingCell, setLoadingCell] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [commentDialogData, setCommentDialogData] = useState<{
    isOpen: boolean;
    date: Date | null;
    comment?: any;
  }>({ isOpen: false, date: null });

  const { groups, isLoading } = useGroups();
  const { students, scheduleDates, attendance, dateComments } = useAttendanceData(selectedGroup, selectedMonth);
  const { dateCommentMutation, bulkAttendanceMutation } = useAttendanceMutations(selectedGroup, selectedMonth);

  const handleMarkAttendance = (studentId: number, date: Date) => {
    // Реализуйте логику отметки посещаемости (например, через fetch или через мутацию)
    console.log("Отметить посещаемость для студента", studentId, "на дату", date);
  };

  const handleBulkAttendance = (date: Date, status: keyof typeof attendance[0]["status"]) => {
    if (!selectedGroup) return;
    bulkAttendanceMutation.mutate({
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
    return record ? record.status : "NOT_MARKED";
  };

  const handleCommentSave = (comment: string) => {
    if (!selectedGroup || !commentDialogData.date) return;
    if (commentDialogData.comment?.id) {
      dateCommentMutation.mutate({
        groupId: selectedGroup.id,
        date: format(commentDialogData.date, "yyyy-MM-dd"),
        comment,
        commentId: commentDialogData.comment.id,
      });
    } else {
      dateCommentMutation.mutate({
        groupId: selectedGroup.id,
        date: format(commentDialogData.date, "yyyy-MM-dd"),
        comment,
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Посещаемость</h1>
        <GroupsList groups={groups} onGroupSelect={setSelectedGroup} />
        {selectedGroup && (
          <>
            <AttendanceTable
              students={students || []}
              scheduleDates={scheduleDates || []}
              dateComments={dateComments || []}
              loadingCell={loadingCell}
              onMarkAttendance={handleMarkAttendance}
              onBulkAttendance={handleBulkAttendance}
              onCommentClick={(date, comment) =>
                setCommentDialogData({ isOpen: true, date, comment })
              }
              onDeleteComment={(date, comment) =>
                dateCommentMutation.mutate({
                  groupId: selectedGroup.id,
                  date: format(date, "yyyy-MM-dd"),
                  comment: "",
                  commentId: comment.id,
                  action: "delete",
                })
              }
              getAttendanceStatus={getAttendanceStatus}
            />
            {commentDialogData.isOpen && commentDialogData.date && (
              <CommentDialog
                isOpen={commentDialogData.isOpen}
                onClose={() => setCommentDialogData({ isOpen: false, date: null })}
                date={commentDialogData.date}
                groupId={selectedGroup.id}
                existingComment={commentDialogData.comment}
                onSave={handleCommentSave}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
