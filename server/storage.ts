import { IStorage } from "./interfaces";
import {
  User, Student, Group, Schedule, Attendance, Payment,
  InsertUser, InsertStudent, InsertGroup, InsertSchedule, InsertAttendance, InsertPayment,
  users, students, groups, schedules, attendance, payments
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
    return await db.select().from(students);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    try {
      console.log('Starting student creation with data:', student);
      console.log('Converting date:', student.birthDate);
      const dateString = new Date(student.birthDate).toISOString();
      console.log('Converted date:', dateString);

      const studentData = {
        ...student,
        birthDate: dateString
      };
      console.log('Final student data:', studentData);

      const [result] = await db.insert(students).values(studentData).returning();
      console.log('Database response:', result);
      return result;
    } catch (error) {
      console.error('Detailed error creating student:', error);
      throw error;
    }
  }

  async updateStudent(id: number, student: Partial<Student>): Promise<Student> {
    const [result] = await db
      .update(students)
      .set(student)
      .where(eq(students.id, id))
      .returning();
    return result;
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [result] = await db.insert(groups).values(group).returning();
    return result;
  }

  // Schedules
  async getSchedules(groupId?: number): Promise<Schedule[]> {
    if (groupId) {
      return await db.select().from(schedules).where(eq(schedules.groupId, groupId));
    }
    return await db.select().from(schedules);
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [result] = await db.insert(schedules).values(schedule).returning();
    return result;
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
}

export const storage = new PostgresStorage();