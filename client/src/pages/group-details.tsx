import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Group, Student, Attendance, Schedule } from "@shared/schema";
import { useParams, useLocation } from "wouter";
import { Loader2, ChevronLeft, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ru } from "date-fns/locale";

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [_, navigate] = useLocation();

  // Интерфейс для расширенной группы с количеством студентов и списком студентов
  interface GroupWithStudents extends Group {
    currentStudents: number;
    students: Student[];
  }

  // Получение информации о группе (теперь включает и студентов)
  const { data: group, isLoading: isLoadingGroup } = useQuery<GroupWithStudents>({
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

  // Получение расписания группы
  const { data: schedules } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules", id],
    queryFn: async () => {
      const response = await fetch(`/api/schedules?groupId=${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      return response.json();
    },
    enabled: !!id
  });

  if (!group) {
    return (
      <div className="p-6">
        <p className="text-red-500">Группа не найдена</p>
      </div>
    );
  }

  // Форматирование дня недели в читаемый вид
  const formatDayOfWeek = (day: number) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[day];
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/groups')}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Назад к группам
        </Button>
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{group.name}</h1>
        <p className="text-muted-foreground">{group.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Информация о группе</h2>
        <div className="grid md:grid-cols-2 gap-4">
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
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 mr-2" />
          <h2 className="text-xl font-semibold">Расписание занятий</h2>
        </div>
        
        {!schedules?.length ? (
          <div className="py-4 text-center text-muted-foreground">
            Расписание для группы не задано
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="p-3 border rounded-md">
                <div className="font-medium">{formatDayOfWeek(schedule.dayOfWeek)}</div>
                <div className="text-muted-foreground">
                  {schedule.startTime} - {schedule.endTime}
                </div>
              </div>
            ))}
          </div>
        )}
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
