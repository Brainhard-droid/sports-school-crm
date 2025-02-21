import { IStorage } from "./interfaces";
import {
  User, Student, Group, Schedule, Attendance, Payment,
  InsertUser, InsertStudent, InsertGroup, InsertSchedule, InsertAttendance, InsertPayment,
  users, students, groups, schedules, attendance, payments
} from "@shared/schema";
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export class PostgresStorage implements IStorage {
  private sql;
  private db;
  sessionStore: session.Store;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.sql = sql;
    this.db = drizzle(sql);
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Students
  async getStudents(): Promise<Student[]> {
    return await this.db.select().from(students);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const result = await this.db.select().from(students).where(eq(students.id, id));
    return result[0];
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const result = await this.db.insert(students).values(student).returning();
    return result[0];
  }

  async updateStudent(id: number, student: Partial<Student>): Promise<Student> {
    const result = await this.db
      .update(students)
      .set(student)
      .where(eq(students.id, id))
      .returning();
    return result[0];
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    return await this.db.select().from(groups);
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const result = await this.db.select().from(groups).where(eq(groups.id, id));
    return result[0];
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const result = await this.db.insert(groups).values(group).returning();
    return result[0];
  }

  // Schedules
  async getSchedules(groupId?: number): Promise<Schedule[]> {
    if (groupId) {
      return await this.db.select().from(schedules).where(eq(schedules.groupId, groupId));
    }
    return await this.db.select().from(schedules);
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const result = await this.db.insert(schedules).values(schedule).returning();
    return result[0];
  }

  // Attendance
  async getAttendance(groupId: number, date: Date): Promise<Attendance[]> {
    return await this.db
      .select()
      .from(attendance)
      .where(and(eq(attendance.groupId, groupId), eq(attendance.date, date)));
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const result = await this.db.insert(attendance).values(attendance).returning();
    return result[0];
  }

  // Payments
  async getPayments(studentId?: number): Promise<Payment[]> {
    if (studentId) {
      return await this.db.select().from(payments).where(eq(payments.studentId, studentId));
    }
    return await this.db.select().from(payments);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await this.db.insert(payments).values(payment).returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();