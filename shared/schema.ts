import { pgTable, text, serial, integer, boolean, date, timestamp, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Таблицы
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  email: text("email").notNull(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthDate: date("birth_date").notNull(),
  phoneNumber: text("phone_number"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  active: boolean("active").notNull().default(true),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  trainer: integer("trainer").notNull(),
  maxStudents: integer("max_students").notNull(),
  active: boolean("active").notNull().default(true),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
});

// Define attendance status enum
export const AttendanceStatus = {
  NOT_MARKED: "NOT_MARKED",
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
} as const;

export type AttendanceStatusType = typeof AttendanceStatus[keyof typeof AttendanceStatus];

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  groupId: integer("group_id").notNull(),
  date: date("date").notNull(),
  status: text("status").notNull().default(AttendanceStatus.NOT_MARKED),
});

// Новая таблица для комментариев к датам
export const dateComments = pgTable("date_comments", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  date: date("date").notNull(),
  comment: text("comment").notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  amount: integer("amount").notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
});

export const studentGroups = pgTable("student_groups", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  groupId: integer("group_id").notNull(),
  joinDate: timestamp("join_date").notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
});

// Updating TrialRequestStatus enum
export const TrialRequestStatus = {
  NEW: "NEW", // Новая
  TRIAL_ASSIGNED: "TRIAL_ASSIGNED", // Пробное назначено
  REFUSED: "REFUSED", // Отказ
  SIGNED: "SIGNED", // Записан
} as const;

export type TrialRequestStatusType = typeof TrialRequestStatus[keyof typeof TrialRequestStatus];

// Trial requests table
export const trialRequests = pgTable("trial_requests", {
  id: serial("id").primaryKey(),
  childName: text("child_name").notNull(),
  childAge: integer("child_age").notNull(),
  parentName: text("parent_name").notNull(),
  parentPhone: text("parent_phone").notNull(),
  sectionId: integer("section_id").notNull(),
  branchId: integer("branch_id").notNull(),
  desiredDate: date("desired_date").notNull(),
  status: text("status").notNull().default(TrialRequestStatus.NEW),
  scheduledDate: timestamp("scheduled_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  notes: text("notes"),
});

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  active: boolean("active").notNull().default(true),
});

// Sports sections table with predefined sections
export const sportsSections = pgTable("sports_sections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
});

// Branch sections table - связь филиалов с секциями и их расписанием
export const branchSections = pgTable("branch_sections", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  sectionId: integer("section_id").notNull(),
  schedule: text("schedule").notNull(), // JSON строка с расписанием
  active: boolean("active").notNull().default(true),
});


// Types
export type User = typeof users.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type StudentGroup = typeof studentGroups.$inferSelect;
export type DateComment = typeof dateComments.$inferSelect;
export type BaseStudent = typeof students.$inferSelect;
export type Student = BaseStudent & {
  groups?: {
    id: number;
    name: string;
  }[];
};
export type ExtendedGroup = Group & {
  students?: Student[];
  schedules?: Schedule[];
};
export type Branch = typeof branches.$inferSelect;
export type SportsSection = typeof sportsSections.$inferSelect;
export type TrialRequest = typeof trialRequests.$inferSelect;
export type ExtendedTrialRequest = TrialRequest & {
  branch?: Branch;
  section?: SportsSection;
};
export type BranchSection = typeof branchSections.$inferSelect;


// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  email: true,
});

export const insertStudentSchema = createInsertSchema(students);
export const insertGroupSchema = createInsertSchema(groups);
export const insertScheduleSchema = createInsertSchema(schedules);

// Update attendance schema to include status
export const insertAttendanceSchema = createInsertSchema(attendance).extend({
  status: z.enum([AttendanceStatus.NOT_MARKED, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT])
});

export const insertPaymentSchema = createInsertSchema(payments);
export const insertStudentGroupSchema = createInsertSchema(studentGroups);
export const insertDateCommentSchema = createInsertSchema(dateComments);

export const insertBranchSchema = createInsertSchema(branches).omit({ id: true });
export const insertSportsSectionSchema = createInsertSchema(sportsSections).omit({ id: true });
export const insertBranchSectionSchema = createInsertSchema(branchSections).omit({ id: true });
export const insertTrialRequestSchema = createInsertSchema(trialRequests)
  .omit({
    id: true,
    status: true,
    scheduledDate: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
    childAge: z.number().min(3, "Минимальный возраст 3 года").max(18, "Максимальный возраст 18 лет"),
    parentPhone: z.string()
      .regex(/^\+7\d{10}$/, "Телефон должен быть в формате +7XXXXXXXXXX"),
    parentName: z.string().min(2, "Введите ФИО родителя"),
    desiredDate: z.string().refine(
      (date) => {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime()) && parsedDate > new Date();
      },
      "Дата не может быть в прошлом"
    ),
    sectionId: z.number().positive("Выберите секцию"),
    branchId: z.number().positive("Выберите отделение"),
    notes: z.string().optional()
  });

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertStudentGroup = z.infer<typeof insertStudentGroupSchema>;
export type InsertDateComment = z.infer<typeof insertDateCommentSchema>;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type InsertSportsSection = z.infer<typeof insertSportsSectionSchema>;
export type InsertBranchSection = z.infer<typeof insertBranchSectionSchema>;
export type InsertTrialRequest = z.infer<typeof insertTrialRequestSchema>;