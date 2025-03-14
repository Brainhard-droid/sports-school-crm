
import { useState } from "react";
import { format } from "date-fns";
import { Group, AttendanceStatus, DateComment } from "@shared/schema";
import { Layout } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import { useAttendanceMutations } from "@/hooks/useAttendanceMutations";
import { CommentDialog } from "@/components/attendance/CommentDialog";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loadingCell, setLoadingCell] = useState<string | null>(null);
  const [commentDialogData, setCommentDialogData] = useState<{
    isOpen: boolean;
    date: Date | null;
    comment?: DateComment;
  }>({ isOpen: false, date: null });

  const { groups, students, scheduleDates, attendance, dateComments } = useAttendanceData(
    selectedGroup,
    selectedMonth
  );

  const { dateCommentMutation, bulkAttendanceMutation } = useAttendanceMutations(
    selectedGroup,
    selectedMonth
  );

  const handleMarkAttendance = async (studentId: number, date: Date) => {
    if (!selectedGroup) return;

    const cellId = `${studentId}-${format(date, "yyyy-MM-dd")}`;
    setLoadingCell(cellId);

    const existingAttendance = attendance?.find(
      (a) =>
        a.studentId === studentId &&
        format(new Date(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );

    let nextStatus: keyof typeof AttendanceStatus;
    if (!existingAttendance || existingAttendance.status === AttendanceStatus.ABSENT) {
      nextStatus = "PRESENT";
    } else {
      nextStatus = "ABSENT";
    }

    try {
      if (existingAttendance) {
        await fetch(`/api/attendance/${existingAttendance.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
          credentials: "include",
        });
      } else {
        await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            groupId: selectedGroup.id,
            date: format(date, "yyyy-MM-dd"),
            status: nextStatus,
          }),
          credentials: "include",
        });
      }
    } finally {
      setLoadingCell(null);
    }
  };

  const getAttendanceStatus = (studentId: number, date: Date) => {
    const record = attendance?.find(
      (a) =>
        a.studentId === studentId &&
        format(new Date(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
    return record ? record.status : null;
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

  const handleBulkAttendance = (date: Date, status: keyof typeof AttendanceStatus) => {
    if (!selectedGroup) return;
    bulkAttendanceMutation.mutate({
      groupId: selectedGroup.id,
      date: format(date, "yyyy-MM-dd"),
      status,
    });
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Посещаемость</h1>

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

        {selectedGroup && (
          <AttendanceTable
            students={students || []}
            scheduleDates={scheduleDates || []}
            dateComments={dateComments || []}
            loadingCell={loadingCell}
            onMarkAttendance={handleMarkAttendance}
            onCommentClick={(date, comment) =>
              setCommentDialogData({ isOpen: true, date, comment })
            }
            getAttendanceStatus={getAttendanceStatus}
            onBulkAttendance={handleBulkAttendance}
          />
        )}

        {commentDialogData.isOpen && commentDialogData.date && selectedGroup && (
          <CommentDialog
            isOpen={commentDialogData.isOpen}
            onClose={() => setCommentDialogData({ isOpen: false, date: null })}
            date={commentDialogData.date}
            groupId={selectedGroup.id}
            existingComment={commentDialogData.comment}
            onSave={handleCommentSave}
          />
        )}
      </div>
    </Layout>
  );
}
