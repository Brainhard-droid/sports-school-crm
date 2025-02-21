import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertStudentSchema, insertGroupSchema, insertScheduleSchema, insertAttendanceSchema, insertPaymentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Students
  app.get("/api/students", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const students = await storage.getStudents();
    res.json(students);
  });

  app.post("/api/students", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertStudentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const student = await storage.createStudent(parsed.data);
    res.status(201).json(student);
  });

  app.patch("/api/students/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const student = await storage.updateStudent(id, req.body);
    res.json(student);
  });

  // Groups
  app.get("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const groups = await storage.getGroups();
    res.json(groups);
  });

  app.post("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertGroupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const group = await storage.createGroup(parsed.data);
    res.status(201).json(group);
  });

  // Schedules
  app.get("/api/schedules", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const groupId = req.query.groupId ? parseInt(req.query.groupId as string) : undefined;
    const schedules = await storage.getSchedules(groupId);
    res.json(schedules);
  });

  app.post("/api/schedules", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertScheduleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const schedule = await storage.createSchedule(parsed.data);
    res.status(201).json(schedule);
  });

  // Attendance
  app.get("/api/attendance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { groupId, date } = req.query;
    if (!groupId || !date) return res.status(400).send("Missing groupId or date");
    const attendance = await storage.getAttendance(parseInt(groupId as string), new Date(date as string));
    res.json(attendance);
  });

  app.post("/api/attendance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertAttendanceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const attendance = await storage.createAttendance(parsed.data);
    res.status(201).json(attendance);
  });

  // Payments
  app.get("/api/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
    const payments = await storage.getPayments(studentId);
    res.json(payments);
  });

  app.post("/api/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertPaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const payment = await storage.createPayment(parsed.data);
    res.status(201).json(payment);
  });

  const httpServer = createServer(app);
  return httpServer;
}
