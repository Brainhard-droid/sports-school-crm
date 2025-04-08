import { AttendanceTable } from "./AttendanceTable";
import AttendanceControls from "./AttendanceControls";
import ExportAttendance from "./ExportAttendance";
import { Loader2 } from "lucide-react";
import { AttendanceStatus, DateComment, Group, Student } from "@shared/schema";
import { format } from "date-fns";

interface AttendanceContentProps {
  isLoading: boolean;
  scheduleDates: Date[];
  students: Student[];
  attendance: any[];
  dateComments: DateComment[];
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadingCell: string | null;
  groupName: string;
  handleMarkAttendance: (studentId: number, date: Date) => void;
  handleBulkAttendance: (date: Date, status: keyof typeof AttendanceStatus) => void;
  handleCommentAction: (data: { date: Date; comment?: DateComment; action?: 'delete' }) => void;
  getAttendanceStatus: (studentId: number, date: Date) => keyof typeof AttendanceStatus;
}

const AttendanceContent = ({
  isLoading,
  scheduleDates,
  students,
  attendance,
  dateComments,
  selectedMonth,
  setSelectedMonth,
  searchQuery,
  setSearchQuery,
  loadingCell,
  groupName,
  handleMarkAttendance,
  handleBulkAttendance,
  handleCommentAction,
  getAttendanceStatus
}: AttendanceContentProps) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4">{groupName}</h2>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
              <AttendanceControls
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              <ExportAttendance handleExport={() => {}} />
            </div>
            
            <div className="overflow-x-auto">
              <AttendanceTable
                scheduleDates={scheduleDates}
                students={students}
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceContent;