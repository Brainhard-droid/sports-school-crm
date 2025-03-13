import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
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
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  groupId: integer("group_id").notNull(),
  date: date("date").notNull(),
  present: boolean("present").notNull(),
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

// Types
export type User = typeof users.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type StudentGroup = typeof studentGroups.$inferSelect;

// Base student type without groups
export type BaseStudent = typeof students.$inferSelect;

// Extended student type with groups
export type Student = BaseStudent & {
  groups?: {
    id: number;
    name: string;
  }[];
};

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
export const insertAttendanceSchema = createInsertSchema(attendance);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertStudentGroupSchema = createInsertSchema(studentGroups);

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertStudentGroup = z.infer<typeof insertStudentGroupSchema>;