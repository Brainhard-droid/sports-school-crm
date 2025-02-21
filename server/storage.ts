import { IStorage } from "./interfaces";
import {
  User, Student, Group, Schedule, Attendance, Payment,
  InsertUser, InsertStudent, InsertGroup, InsertSchedule, InsertAttendance, InsertPayment
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private groups: Map<number, Group>;
  private schedules: Map<number, Schedule>;
  private attendance: Map<number, Attendance>;
  private payments: Map<number, Payment>;
  sessionStore: session.Store;
  currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.groups = new Map();
    this.schedules = new Map();
    this.attendance = new Map();
    this.payments = new Map();
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
    this.currentId = {
      users: 1,
      students: 1,
      groups: 1,
      schedules: 1,
      attendance: 1,
      payments: 1
    };
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Students
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.currentId.students++;
    const newStudent: Student = { ...student, id };
    this.students.set(id, newStudent);
    return newStudent;
  }

  async updateStudent(id: number, student: Partial<Student>): Promise<Student> {
    const existing = this.students.get(id);
    if (!existing) throw new Error("Student not found");
    const updated = { ...existing, ...student };
    this.students.set(id, updated);
    return updated;
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const id = this.currentId.groups++;
    const newGroup: Group = { ...group, id };
    this.groups.set(id, newGroup);
    return newGroup;
  }

  // Schedules
  async getSchedules(groupId?: number): Promise<Schedule[]> {
    const schedules = Array.from(this.schedules.values());
    return groupId ? schedules.filter(s => s.groupId === groupId) : schedules;
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const id = this.currentId.schedules++;
    const newSchedule: Schedule = { ...schedule, id };
    this.schedules.set(id, newSchedule);
    return newSchedule;
  }

  // Attendance
  async getAttendance(groupId: number, date: Date): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      a => a.groupId === groupId && a.date.getTime() === date.getTime()
    );
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const id = this.currentId.attendance++;
    const newAttendance: Attendance = { ...attendance, id };
    this.attendance.set(id, newAttendance);
    return newAttendance;
  }

  // Payments
  async getPayments(studentId?: number): Promise<Payment[]> {
    const payments = Array.from(this.payments.values());
    return studentId ? payments.filter(p => p.studentId === studentId) : payments;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.currentId.payments++;
    const newPayment: Payment = { ...payment, id };
    this.payments.set(id, newPayment);
    return newPayment;
  }
}

export const storage = new MemStorage();
