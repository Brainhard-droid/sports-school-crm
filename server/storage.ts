import { IStorage } from "./interfaces";
import {
  User, BaseStudent, Student, Group, Schedule, Attendance, Payment, StudentGroup,
  InsertUser, InsertStudent, InsertGroup, InsertSchedule, InsertPayment, InsertStudentGroup,
  users, students, groups, schedules, attendance, payments, studentGroups, DateComment, InsertDateComment, AttendanceStatus
} from "@shared/schema";
import { eq, and, gte, lte } from 'drizzle-orm';
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from './db';

const PostgresSessionStore = connectPg(session);

export class PostgresStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
      tableName: 'session'
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Students
  async getStudents(): Promise<Student[]> {
    try {
      const baseStudents = await db.select().from(students);

      // Для каждого студента получаем его группы
      const studentsWithGroups = await Promise.all(
        baseStudents.map(async (student) => {
          const groupsData = await db
            .select({
              id: groups.id,
              name: groups.name,
            })
            .from(studentGroups)
            .innerJoin(groups, eq(groups.id, studentGroups.groupId))
            .where(
              and(
                eq(studentGroups.studentId, student.id),
                eq(studentGroups.active, true)
              )
            );

          return {
            ...student,
            groups: groupsData,
          };
        })
      );

      return studentsWithGroups;
    } catch (error) {
      console.error('Error getting students:', error);
      throw error;
    }
  }

  async getStudent(id: number): Promise<Student | undefined> {
    try {
      const [baseStudent] = await db.select().from(students).where(eq(students.id, id));

      if (!baseStudent) return undefined;

      const groupsData = await db
        .select({
          id: groups.id,
          name: groups.name,
        })
        .from(studentGroups)
        .innerJoin(groups, eq(groups.id, studentGroups.groupId))
        .where(
          and(
            eq(studentGroups.studentId, id),
            eq(studentGroups.active, true)
          )
        );

      return {
        ...baseStudent,
        groups: groupsData,
      };
    } catch (error) {
      console.error('Error getting student:', error);
      throw error;
    }
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    try {
      const [result] = await db.insert(students).values(student).returning();
      return {
        ...result,
        groups: [],
      };
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  async updateStudent(id: number, student: Partial<Student>): Promise<Student> {
    try {
      const [result] = await db
        .update(students)
        .set(student)
        .where(eq(students.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    try {
      const groupsList = await db.select().from(groups);

      // Для каждой группы получаем расписание
      const groupsWithSchedules = await Promise.all(
        groupsList.map(async (group) => {
          const schedulesList = await db
            .select()
            .from(schedules)
            .where(eq(schedules.groupId, group.id));

          return {
            ...group,
            schedules: schedulesList,
          };
        })
      );

      return groupsWithSchedules;
    } catch (error) {
      console.error('Error getting groups:', error);
      throw error;
    }
  }

  async getGroup(id: number): Promise<Group | undefined> {
    try {
      const [group] = await db.select().from(groups).where(eq(groups.id, id));
      return group;
    } catch (error) {
      console.error('Error getting group:', error);
      throw error;
    }
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    try {
      const [result] = await db.insert(groups).values(group).returning();
      return result;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  // Student Groups
  async getGroupStudentsWithDetails(groupId: number): Promise<Student[]> {
    try {
      const result = await db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          birthDate: students.birthDate,
          phoneNumber: students.phoneNumber,
          parentName: students.parentName,
          parentPhone: students.parentPhone,
          active: students.active,
        })
        .from(studentGroups)
        .innerJoin(students, eq(students.id, studentGroups.studentId))
        .where(
          and(
            eq(studentGroups.groupId, groupId),
            eq(studentGroups.active, true)
          )
        );

      return result;
    } catch (error) {
      console.error('Error getting group students:', error);
      throw error;
    }
  }

  async addStudentToGroup(data: InsertStudentGroup): Promise<StudentGroup> {
    try {
      const [result] = await db
        .insert(studentGroups)
        .values(data)
        .returning();
      return result;
    } catch (error) {
      console.error('Error adding student to group:', error);
      throw error;
    }
  }

  async removeStudentFromGroup(studentId: number, groupId: number): Promise<void> {
    try {
      await db
        .update(studentGroups)
        .set({ active: false })
        .where(
          and(
            eq(studentGroups.studentId, studentId),
            eq(studentGroups.groupId, groupId)
          )
        );
    } catch (error) {
      console.error('Error removing student from group:', error);
      throw error;
    }
  }

  // Student Status
  async updateStudentStatus(id: number, active: boolean): Promise<Student> {
    try {
      const [student] = await db
        .update(students)
        .set({ active })
        .where(eq(students.id, id))
        .returning();
      return student;
    } catch (error) {
      console.error('Error updating student status:', error);
      throw error;
    }
  }

  // Delete operations
  async deleteStudent(id: number): Promise<void> {
    try {
      await db
        .delete(studentGroups)
        .where(eq(studentGroups.studentId, id));

      await db
        .delete(students)
        .where(eq(students.id, id));
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  async deleteGroup(id: number): Promise<void> {
    try {
      await db
        .delete(studentGroups)
        .where(eq(studentGroups.groupId, id));

      await db
        .delete(schedules)
        .where(eq(schedules.groupId, id));

      await db
        .delete(groups)
        .where(eq(groups.id, id));
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  // Schedules
  async getSchedules(groupId?: number): Promise<Schedule[]> {
    try {
      if (groupId) {
        return await db.select().from(schedules).where(eq(schedules.groupId, groupId));
      }
      return await db.select().from(schedules);
    } catch (error) {
      console.error('Error getting schedules:', error);
      throw error;
    }
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    try {
      const [result] = await db.insert(schedules).values(schedule).returning();
      return result;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }

  // Payments
  async getPayments(studentId?: number): Promise<Payment[]> {
    if (studentId) {
      return await db.select().from(payments).where(eq(payments.studentId, studentId));
    }
    return await db.select().from(payments);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [result] = await db.insert(payments).values(payment).returning();
    return result;
  }

  // Новые методы для работы с группами студентов
  async getStudentGroups(studentId: number): Promise<StudentGroup[]> {
    return await db
      .select()
      .from(studentGroups)
      .where(eq(studentGroups.studentId, studentId));
  }

  async getGroupStudents(groupId: number): Promise<StudentGroup[]> {
    return await db
      .select()
      .from(studentGroups)
      .where(eq(studentGroups.groupId, groupId));
  }

  // Attendance
  async getAttendance(groupId: number, date: Date): Promise<Attendance[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.groupId, groupId),
            gte(attendance.date, startOfDay),
            lte(attendance.date, endOfDay)
          )
        );
    } catch (error) {
      console.error('Error getting attendance:', error);
      throw error;
    }
  }

    async getMonthlyAttendance(groupId: number, month: number, year: number): Promise<Attendance[]> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      return await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.groupId, groupId),
            gte(attendance.date, startDate),
            lte(attendance.date, endDate)
          )
        );
    } catch (error) {
      console.error('Error getting monthly attendance:', error);
      throw error;
    }
  }

  async createAttendance(data: InsertAttendance): Promise<Attendance> {
    try {
      const [result] = await db
        .insert(attendance)
        .values({
          studentId: data.studentId,
          groupId: data.groupId,
          date: data.date,
          status: data.status,
        })
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating attendance:', error);
      throw error;
    }
  }

  async updateAttendance(id: number, data: Partial<Attendance>): Promise<Attendance> {
    try {
      const [result] = await db
        .update(attendance)
        .set(data)
        .where(eq(attendance.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  }

  async getGroupScheduleDates(groupId: number, month: number, year: number): Promise<Date[]> {
    try {
      // Get group's schedule
      const groupSchedules = await db
        .select()
        .from(schedules)
        .where(eq(schedules.groupId, groupId));

      // Get all days of the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const daysInMonth = endDate.getDate();

      // Filter dates based on schedule
      const scheduleDates: Date[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay() || 7; // Convert Sunday (0) to 7

        if (groupSchedules.some(schedule => schedule.dayOfWeek === dayOfWeek)) {
          scheduleDates.push(date);
        }
      }

      return scheduleDates;
    } catch (error) {
      console.error('Error getting schedule dates:', error);
      throw error;
    }
  }

  // Метод для обновления статуса группы
  async updateGroupStatus(id: number, active: boolean): Promise<Group> {
    try {
      const [group] = await db
        .update(groups)
        .set({ active })
        .where(eq(groups.id, id))
        .returning();
      return group;
    } catch (error) {
      console.error('Error updating group status:', error);
      throw error;
    }
  }

  async updateGroup(id: number, data: Partial<InsertGroup>): Promise<Group> {
    try {
      const [group] = await db
        .update(groups)
        .set(data)
        .where(eq(groups.id, id))
        .returning();
      return group;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  async updateSchedule(id: number, data: Partial<InsertSchedule>): Promise<Schedule> {
    try {
      const [schedule] = await db
        .update(schedules)
        .set(data)
        .where(eq(schedules.id, id))
        .returning();
      return schedule;
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  }

  async deleteSchedule(id: number): Promise<void> {
    try {
      await db
        .delete(schedules)
        .where(eq(schedules.id, id));
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }

  // Добавляем новые методы в класс PostgresStorage
  async getDateComments(groupId: number, month: number, year: number): Promise<DateComment[]> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      return await db
        .select()
        .from(dateComments)
        .where(
          and(
            eq(dateComments.groupId, groupId),
            gte(dateComments.date, startDate),
            lte(dateComments.date, endDate)
          )
        );
    } catch (error) {
      console.error('Error getting date comments:', error);
      throw error;
    }
  }

  async createDateComment(data: InsertDateComment): Promise<DateComment> {
    try {
      const [result] = await db
        .insert(dateComments)
        .values(data)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating date comment:', error);
      throw error;
    }
  }

  async updateDateComment(id: number, comment: string): Promise<DateComment> {
    try {
      const [result] = await db
        .update(dateComments)
        .set({ comment })
        .where(eq(dateComments.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating date comment:', error);
      throw error;
    }
  }

  async deleteDateComment(id: number): Promise<void> {
    try {
      await db
        .delete(dateComments)
        .where(eq(dateComments.id, id));
    } catch (error) {
      console.error('Error deleting date comment:', error);
      throw error;
    }
  }

  // Добавляем метод для массового обновления посещаемости
  async updateBulkAttendance(
    groupId: number,
    date: string,
    status: keyof typeof AttendanceStatus
  ): Promise<void> {
    try {
      const students = await this.getGroupStudentsWithDetails(groupId);
      console.log(`Updating attendance for group ${groupId}, date ${date}, status ${status}`);
      console.log(`Found ${students.length} students to update`);

      for (const student of students) {
        console.log(`Processing student ${student.id}`);
        const existingAttendance = await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.studentId, student.id),
              eq(attendance.groupId, groupId),
              eq(attendance.date, date)
            )
          );

        console.log(`Existing attendance for student ${student.id}:`, existingAttendance);

        if (existingAttendance.length > 0) {
          await db
            .update(attendance)
            .set({ status })
            .where(eq(attendance.id, existingAttendance[0].id));
          console.log(`Updated existing attendance for student ${student.id}`);
        } else {
          await db
            .insert(attendance)
            .values({
              studentId: student.id,
              groupId,
              date,
              status,
            });
          console.log(`Created new attendance for student ${student.id}`);
        }
      }
    } catch (error) {
      console.error('Error updating bulk attendance:', error);
      throw error;
    }
  }
}

export const storage = new PostgresStorage();