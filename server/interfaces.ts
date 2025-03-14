import { Store } from "express-session";
import {
  User, Student, Group, Schedule, Attendance, Payment, StudentGroup, DateComment,
  InsertUser, InsertStudent, InsertGroup, InsertSchedule, InsertAttendance, InsertPayment, InsertStudentGroup, InsertDateComment
} from "@shared/schema";

export interface IStorage {
  sessionStore: Store;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;

  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<Student>): Promise<Student>;

  // Groups
  getGroups(): Promise<Group[]>;
  getGroup(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;

  // Student Groups
  getStudentGroups(studentId: number): Promise<StudentGroup[]>;
  getGroupStudents(groupId: number): Promise<StudentGroup[]>;
  addStudentToGroup(studentGroup: InsertStudentGroup): Promise<StudentGroup>;
  removeStudentFromGroup(studentId: number, groupId: number): Promise<void>;

  // Schedules
  getSchedules(groupId?: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;

  // Attendance
  getAttendance(groupId: number, date: Date): Promise<Attendance[]>;
  getMonthlyAttendance(groupId: number, month: number, year: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;

  // Date Comments
  getDateComments(groupId: number, month: number, year: number): Promise<DateComment[]>;
  createDateComment(comment: InsertDateComment): Promise<DateComment>;
  updateDateComment(id: number, comment: string): Promise<DateComment>;
  deleteDateComment(id: number): Promise<void>;

  // Payments
  getPayments(studentId?: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
}