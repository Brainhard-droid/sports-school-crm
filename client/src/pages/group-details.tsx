import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Group, Student, Attendance } from "@shared/schema";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Получение информации о группе (теперь включает и студентов)
  const { data: group, isLoading: isLoadingGroup } = useQuery<Group & { students?: Student[] }>({
    queryKey: ["/api/groups", id],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch group');
      }
      return response.json();
    }
  });

  // Получение посещаемости
  const { data: attendance } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", id, selectedDate],
    queryFn: async () => {
      const response = await fetch(
        `/api/attendance?groupId=${id}&date=${selectedDate.toISOString()}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }
      return response.json();
    },
    enabled: !!id && !!selectedDate
  });

  if (isLoadingGroup) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-6">
        <p className="text-red-500">Группа не найдена</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{group.name}</h1>
        <p className="text-muted-foreground">{group.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Информация о группе</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Тренер</p>
            <p className="font-medium">ID: {group.trainer}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Учеников</p>
            <p className="font-medium">{group.currentStudents || 0} / {group.maxStudents}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Ученики и посещаемость</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Родитель</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Статус посещения</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!group.students?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  В группе нет учеников
                </TableCell>
              </TableRow>
            ) : (
              group.students.map((student) => {
                const studentAttendance = attendance?.find(
                  (a) => a.studentId === student.id
                );

                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.parentName}</TableCell>
                    <TableCell>{student.parentPhone}</TableCell>
                    <TableCell>
                      {studentAttendance ? (
                        studentAttendance.status === "PRESENT" ? (
                          <span className="text-green-600">Присутствовал</span>
                        ) : studentAttendance.status === "ABSENT" ? (
                          <span className="text-red-600">Отсутствовал</span>
                        ) : (
                          <span className="text-muted-foreground">Не отмечен</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">Не отмечен</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
