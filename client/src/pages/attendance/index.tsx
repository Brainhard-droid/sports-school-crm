import { useState } from "react";
import { Layout } from "@/components/layout/navbar";
import { useGroups } from "./hooks/useGroups";
import { useAttendance } from "./hooks/useAttendance";
import { useStudents } from "./hooks/useStudents";
import { useSchedule } from "./hooks/useSchedule";
import { useComments } from "./hooks/useComments";
import { useBulkAttendance } from "./hooks/useBulkAttendance";
import GroupsList from "./components/GroupsList";
import AttendanceTable from "./components/AttendanceTable";
import AttendanceControls from "./components/AttendanceControls";
import ExportAttendance from "./components/ExportAttendance";
import CommentDialog from "./components/CommentDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [loadingCell, setLoadingCell] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [commentDialogData, setCommentDialogData] = useState<{ 
    isOpen: boolean; 
    date: Date | null; 
    comment?: any 
  }>({ isOpen: false, date: null });

  const { groups } = useGroups();
  const { students } = useStudents(selectedGroup);
  const { scheduleDates } = useSchedule(selectedGroup, selectedMonth.getMonth() + 1, selectedMonth.getFullYear());
  const { attendance, markAttendanceMutation } = useAttendance(
    selectedGroup, 
    selectedMonth.getMonth() + 1, 
    selectedMonth.getFullYear()
  );
  const { dateComments, commentMutation } = useComments(
    selectedGroup, 
    selectedMonth.getMonth() + 1, 
    selectedMonth.getFullYear()
  );
  const { bulkAttendanceMutation } = useBulkAttendance(
    selectedGroup, 
    selectedMonth.getMonth() + 1, 
    selectedMonth.getFullYear()
  );

  const handleMarkAttendance = (studentId: number, date: Date) => {
    if (!selectedGroup) return;
    const cellId = `${studentId}-${date.toISOString()}`;
    setLoadingCell(cellId);
    const status = attendance?.find(
      (a) => a.studentId === studentId && a.date === date.toISOString()
    )?.status || "PRESENT";
    markAttendanceMutation.mutate({ studentId, date, status });
  };

  const handleSaveComment = (comment: string) => {
    if (!selectedGroup || !commentDialogData.date) return;
    commentMutation.mutate({
      groupId: selectedGroup,
      date: commentDialogData.date.toISOString(),
      comment,
      commentId: commentDialogData.comment?.id
    });
  };

  const handleBulkAttendance = (date: Date, status: any) => {
    if (!selectedGroup) return;
    bulkAttendanceMutation.mutate({
      groupId: selectedGroup,
      date: date.toISOString(),
      status
    });
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Посещаемость</h1>
        <GroupsList 
          groups={groups} 
          selectedGroupId={selectedGroup || undefined} 
          onSelectGroup={setSelectedGroup} 
        />

        {selectedGroup && (
          <Dialog open modal onOpenChange={() => setSelectedGroup(null)}>
            <DialogContent className="max-w-[95vw] w-fit">
              <AttendanceControls
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              <ExportAttendance handleExport={() => {}} />
              <AttendanceTable
                scheduleDates={scheduleDates}
                students={students}
                attendance={attendance}
                dateComments={dateComments}
                loadingCell={loadingCell}
                handleMarkAttendance={handleMarkAttendance}
                handleBulkAttendance={handleBulkAttendance}
                setCommentDialogData={setCommentDialogData}
                getAttendanceStatus={(studentId, date) => {
                  const record = attendance?.find(
                    (a) => 
                      a.studentId === studentId && 
                      a.date === date.toISOString()
                  );
                  return record?.status || "NOT_MARKED";
                }}
                getStudentStats={(studentId) => {
                  const studentAttendance = attendance?.filter(a => a.studentId === studentId) || [];
                  const totalClasses = scheduleDates?.length || 0;
                  const attended = studentAttendance.filter(a => a.status === "PRESENT").length;
                  const percentage = totalClasses ? Math.round((attended / totalClasses) * 100) : 0;
                  return { attended, totalClasses, percentage };
                }}
              />

              {commentDialogData.isOpen && commentDialogData.date && (
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