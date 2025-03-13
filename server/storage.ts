import { IStorage } from "./interfaces";
import {
  User, BaseStudent, Student, Group, Schedule, Attendance, Payment, StudentGroup,
  InsertUser, InsertStudent, InsertGroup, InsertSchedule, InsertAttendance, InsertPayment, InsertStudentGroup,
  users, students, groups, schedules, attendance, payments, studentGroups
} from "@shared/schema";
import { eq, and } from 'drizzle-orm';
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
    return await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.groupId, groupId),
          eq(attendance.date, date.toISOString().split('T')[0])
        )
      );
  }

  async createAttendance(data: InsertAttendance): Promise<Attendance> {
    const [result] = await db.insert(attendance).values(data).returning();
    return result;
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
}

export const storage = new PostgresStorage();