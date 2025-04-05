import { Store } from "express-session";
import {
  User, Student, Group, Schedule, Attendance, Payment, StudentGroup, Branch, SportsSection,
  BranchSection, TrialRequest, ExtendedTrialRequest, DateComment,
  InsertUser, InsertStudent, InsertGroup, InsertSchedule, InsertAttendance, InsertPayment, InsertStudentGroup,
  InsertBranch, InsertSportsSection, InsertBranchSection, InsertTrialRequest, InsertDateComment,
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
  updateStudentStatus(id: number, active: boolean): Promise<Student>;
  deleteStudent(id: number): Promise<void>;

  // Groups
  getGroups(): Promise<Group[]>;
  getGroup(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  getGroupStudentsWithDetails(groupId: number): Promise<Student[]>;
  deleteGroup(id: number): Promise<void>;

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
  getAttendanceByMonth(groupId: number, month: number, year: number): Promise<Attendance[]>;
  
  // Date Comments
  getDateComments(groupId: number, month: number, year: number): Promise<DateComment[]>;
  createDateComment(comment: InsertDateComment): Promise<DateComment>;
  getDateComment(groupId: number, date: Date): Promise<DateComment | undefined>;
  
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
  
  // Branch Sections (связь между филиалами и секциями)
  getBranchSections(): Promise<BranchSection[]>;
  getBranchSection(id: number): Promise<BranchSection | undefined>;
  createBranchSection(branchSection: InsertBranchSection): Promise<BranchSection>;
  updateBranchSection(id: number, branchSection: Partial<BranchSection>): Promise<BranchSection>;
  deleteBranchSection(id: number): Promise<void>;
  
  // Trial Requests
  getTrialRequests(): Promise<ExtendedTrialRequest[]>;
  getTrialRequestById(id: number): Promise<ExtendedTrialRequest | undefined>;
  createTrialRequest(request: InsertTrialRequest): Promise<ExtendedTrialRequest>;
  updateTrialRequest(id: number, data: Partial<TrialRequest>): Promise<ExtendedTrialRequest>;
  deleteTrialRequest(id: number): Promise<void>;
}