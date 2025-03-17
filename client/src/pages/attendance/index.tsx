import { useState } from "react";
import { Layout } from "@/components/layout/navbar";
import { useGroups } from "./hooks/useGroups";
import { useAttendance } from "./hooks/useAttendance";
import { useStudents } from "./hooks/useStudents";
import { useSchedule } from "./hooks/useSchedule";
import { useComments } from "./hooks/useComments";
import { useBulkAttendance } from "./hooks/useBulkAttendance";
import GroupsList from "./components/GroupsList";
import { AttendanceTable } from "./components/AttendanceTable";
import AttendanceControls from "./components/AttendanceControls";
import ExportAttendance from "./components/ExportAttendance";
import CommentDialog from "./components/CommentDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { AttendanceStatus } from "@shared/schema";

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
    )?.status || AttendanceStatus.NOT_MARKED;
    markAttendanceMutation.mutate({ studentId, date, status });
  };

  const handleSaveComment = (comment: string) => {
    if (!selectedGroup || !commentDialogData.date) return;
    commentMutation.mutate({
      groupId: selectedGroup,
      date: commentDialogData.date.toISOString(),
      comment,
      commentId: commentDialogData.comment?.id,
    });
    setCommentDialogData({ isOpen: false, date: null });
  };

  const handleBulkAttendance = (date: Date, status: keyof typeof AttendanceStatus) => {
    if (!selectedGroup) return;
    bulkAttendanceMutation.mutate({
      groupId: selectedGroup,
      date: date.toISOString(),
      status,
    });
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
                    setCommentDialogData={setCommentDialogData}
                    getAttendanceStatus={(studentId, date) => {
                      const record = attendance?.find(
                        (a) =>
                          a.studentId === studentId &&
                          a.date === date.toISOString()
                      );
                      return record?.status || AttendanceStatus.NOT_MARKED;
                    }}
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