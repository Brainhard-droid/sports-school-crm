import { Store } from "express-session";
import {
  User, Student, Group, Schedule, Attendance, Payment, StudentGroup, Branch, SportsSection,
  InsertUser, InsertStudent, InsertGroup, InsertSchedule, InsertAttendance, InsertPayment, InsertStudentGroup,
  InsertBranch, InsertSportsSection,
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
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;

  // Payments
  getPayments(studentId?: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Branches
  getBranches(): Promise<Branch[]>;
  getBranch(id: number): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: number, branch: Partial<Branch>): Promise<Branch>;
  deleteBranch(id: number): Promise<void>;
  
  // Sports Sections
  getSportsSections(): Promise<SportsSection[]>;
  getSportsSection(id: number): Promise<SportsSection | undefined>;
  createSportsSection(section: InsertSportsSection): Promise<SportsSection>;
  updateSportsSection(id: number, section: Partial<SportsSection>): Promise<SportsSection>;
  deleteSportsSection(id: number): Promise<void>;
}