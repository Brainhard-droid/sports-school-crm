import { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { eq, and, gte, lte, desc, asc, sql, isNull } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  students,
  groups,
  studentGroups,
  schedules,
  attendance as attendanceTable,
  payments,
  trialRequests,
  TrialRequestStatus,
  AttendanceStatus,
  insertUserSchema,
  insertStudentSchema,
  insertGroupSchema,
  insertStudentGroupSchema,
  insertScheduleSchema,
  insertAttendanceSchema,
  insertPaymentSchema,
  insertTrialRequestSchema,
} from "@shared/schema";
import { storage } from "./storage";

// Импортируем модульные маршруты
import { branchesRouter } from "./routes/branches";
import { sportsSectionsRouter } from "./routes/sports-sections";
import { branchSectionsRouter } from "./routes/branch-sections";
import { hashPassword, sendTrialAssignmentNotification } from "./routes/index";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/", (req, res) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session:', req.session);
    console.log('Auth Status:', req.isAuthenticated());
    res.redirect('/#/');
  });

  // API endpoints
  
  // Get all groups
  app.get("/groups", async (req, res) => {
    try {
      console.log('Session ID:', req.sessionID);
      console.log('Session:', req.session);
      console.log('Auth Status:', req.isAuthenticated());
      
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const groups = await storage.getGroups();
      res.json(groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get a single group
  app.get("/groups/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const id = parseInt(req.params.id);
      const group = await storage.getGroup(id);
      
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      res.json(group);
    } catch (error) {
      console.error('Error fetching group:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Create a new group
  app.post("/groups", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const parsed = insertGroupSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);
      
      const group = await storage.createGroup(parsed.data);
      res.status(201).json(group);
    } catch (error) {
      console.error('Error creating group:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get all students
  app.get("/students", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get a single student
  app.get("/students/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const id = parseInt(req.params.id);
      const student = await storage.getStudent(id);
      
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Create a new student
  app.post("/students", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const parsed = insertStudentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);
      
      const student = await storage.createStudent(parsed.data);
      res.status(201).json(student);
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Update a student
  app.patch("/students/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const id = parseInt(req.params.id);
      const existingStudent = await storage.getStudent(id);
      
      if (!existingStudent) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      const updatedStudent = await storage.updateStudent(id, req.body);
      res.json(updatedStudent);
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get students in a group
  app.get("/groups/:groupId/students", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const groupId = parseInt(req.params.groupId);
      const group = await storage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const studentGroups = await storage.getGroupStudents(groupId);
      
      // Fetch full student details for each student ID
      const studentPromises = studentGroups.map(async (sg) => {
        return await storage.getStudent(sg.studentId);
      });
      
      const students = await Promise.all(studentPromises);
      
      // Filter out any undefined values (in case a student doesn't exist)
      const validStudents = students.filter(Boolean);
      
      res.json(validStudents);
    } catch (error) {
      console.error('Error fetching group students:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Add a student to a group
  app.post("/groups/:groupId/students", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const groupId = parseInt(req.params.groupId);
      const studentId = parseInt(req.body.studentId);
      
      // Verify group exists
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Verify student exists
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      // Add student to group
      const studentGroup = await storage.addStudentToGroup({
        groupId,
        studentId
      });
      
      res.status(201).json(studentGroup);
    } catch (error) {
      console.error('Error adding student to group:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Remove a student from a group
  app.delete("/groups/:groupId/students/:studentId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const groupId = parseInt(req.params.groupId);
      const studentId = parseInt(req.params.studentId);
      
      // Verify group exists
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Verify student exists
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      // Remove student from group
      await storage.removeStudentFromGroup(studentId, groupId);
      
      res.sendStatus(204);
    } catch (error) {
      console.error('Error removing student from group:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Get schedules for a group
  app.get("/groups/:groupId/schedules", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const groupId = parseInt(req.params.groupId);
      
      // Verify group exists
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Get schedules for group
      const schedules = await storage.getSchedules(groupId);
      
      res.json(schedules);
    } catch (error) {
      console.error('Error fetching group schedules:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Create a schedule for a group
  app.post("/groups/:groupId/schedules", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const groupId = parseInt(req.params.groupId);
      
      // Verify group exists
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const parsed = insertScheduleSchema.safeParse({
        ...req.body,
        groupId
      });
      
      if (!parsed.success) return res.status(400).json(parsed.error);
      
      // Create schedule
      const schedule = await storage.createSchedule(parsed.data);
      
      res.status(201).json(schedule);
    } catch (error) {
      console.error('Error creating schedule:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Get attendance for a group on a specific date
  app.get("/groups/:groupId/attendance", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const groupId = parseInt(req.params.groupId);
      const dateParam = req.query.date as string;
      
      if (!dateParam) {
        return res.status(400).json({ error: "Date parameter is required" });
      }
      
      const date = new Date(dateParam);
      
      // Verify group exists
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Get attendance records
      const attendance = await storage.getAttendance(groupId, date);
      
      res.json(attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Record attendance for a student
  app.post("/groups/:groupId/attendance", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const groupId = parseInt(req.params.groupId);
      
      // Verify group exists
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const parsed = insertAttendanceSchema.safeParse({
        ...req.body,
        groupId
      });
      
      if (!parsed.success) return res.status(400).json(parsed.error);
      
      // Record attendance
      const attendance = await storage.createAttendance(parsed.data);
      
      res.status(201).json(attendance);
    } catch (error) {
      console.error('Error recording attendance:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Get payments for a student
  app.get("/students/:studentId/payments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const studentId = parseInt(req.params.studentId);
      
      // Verify student exists
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      // Get payments
      const payments = await storage.getPayments(studentId);
      
      res.json(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Record a payment for a student
  app.post("/students/:studentId/payments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const studentId = parseInt(req.params.studentId);
      
      // Verify student exists
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      const parsed = insertPaymentSchema.safeParse({
        ...req.body,
        studentId
      });
      
      if (!parsed.success) return res.status(400).json(parsed.error);
      
      // Record payment
      const payment = await storage.createPayment(parsed.data);
      
      res.status(201).json(payment);
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Регистрация модульных маршрутов (филиалы, секции, связи)
  branchesRouter.register(app);
  sportsSectionsRouter.register(app);
  branchSectionsRouter.register(app);
  
  // Создаем HTTP сервер
  const httpServer = createServer(app);
  return httpServer;
}