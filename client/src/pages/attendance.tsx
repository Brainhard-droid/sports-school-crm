import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout/navbar";
import { Student, Group, Attendance, InsertAttendance, insertAttendanceSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle, XCircle } from "lucide-react";

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const { toast } = useToast();

  const { data: groups } = useQuery<Group[]>({ 
    queryKey: ["/api/groups"] 
  });
  const { data: students } = useQuery<Student[]>({ 
    queryKey: ["/api/students"] 
  });
  const { data: attendance } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", selectedGroup, selectedDate],
    enabled: !!selectedGroup && !!selectedDate,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: InsertAttendance) => {
      const res = await apiRequest("POST", "/api/attendance", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/attendance", selectedGroup, selectedDate] 
      });
      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });
    },
  });

  const handleMarkAttendance = (studentId: number, present: boolean) => {
    if (!selectedGroup) return;
    
    markAttendanceMutation.mutate({
      studentId,
      groupId: parseInt(selectedGroup),
      date: selectedDate,
      present,
    });
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Attendance</h1>

        <div className="flex gap-4 mb-6">
          <div className="w-[200px]">
            <Select
              value={selectedGroup}
              onValueChange={setSelectedGroup}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Group" />
              </SelectTrigger>
              <SelectContent>
                {groups?.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Button
              variant="outline"
              className="w-[200px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP")}
            </Button>
            <div className="absolute top-10 z-10">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </div>
          </div>
        </div>

        {selectedGroup && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((student) => {
                  const studentAttendance = attendance?.find(
                    (a) => a.studentId === student.id
                  );

                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>
                        {studentAttendance ? (
                          studentAttendance.present ? (
                            <span className="text-green-600">Present</span>
                          ) : (
                            <span className="text-red-600">Absent</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">Not marked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAttendance(student.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAttendance(student.id, false)}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
}
