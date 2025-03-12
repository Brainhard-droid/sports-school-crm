import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import {
  insertStudentSchema,
  insertGroupSchema,
  insertScheduleSchema,
  insertAttendanceSchema,
  insertPaymentSchema,
  insertStudentGroupSchema
} from "@shared/schema";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "./services/email";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Students
  app.get("/api/students", async (req, res) => {
    try {
      console.log('Getting students, auth status:', req.isAuthenticated());
      console.log('Session:', req.session);
      console.log('Session ID:', req.sessionID);
      console.log('User:', req.user);
      console.log('Request cookies:', req.cookies);
      console.log('Request headers:', req.headers);

      if (!req.isAuthenticated()) {
        console.log('User not authenticated');
        return res.status(401).json({ error: "Unauthorized" });
      }

      const students = await storage.getStudents();
      console.log('Retrieved students:', students);
      res.json(students);
    } catch (error) {
      console.error('Error getting students:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Groups
  app.get("/api/groups", async (req, res) => {
    try {
      console.log('Getting groups, auth status:', req.isAuthenticated());
      console.log('Session:', req.session);

      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const groups = await storage.getGroups();
      res.json(groups);
    } catch (error) {
      console.error('Error getting groups:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Password Reset
  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    console.log('Received password reset request for email:', email);

    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('User not found for email:', email);
        // Don't reveal whether a user exists
        return res.json({ success: true });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      console.log('Generated reset token for user:', user.id);

      // Save token to user
      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpiry
      });

      console.log('Updated user with reset token');

      // Send email
      const emailSent = await sendPasswordResetEmail(email, resetToken);
      console.log('Password reset email sent:', emailSent);

      res.json({ success: true });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    const { token, password } = req.body;

    try {
      const user = await storage.getUserByResetToken(token);
      if (!user || !user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Update password and clear reset token
      await storage.updateUser(user.id, {
        password: await hashPassword(password),
        resetToken: null,
        resetTokenExpiry: null
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      console.log('Creating student, auth status:', req.isAuthenticated());
      console.log('Request body:', req.body);

      if (!req.isAuthenticated()) {
        console.log('User not authenticated');
        return res.sendStatus(401);
      }

      const parsed = insertStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        console.log('Validation error:', parsed.error);
        return res.status(400).json(parsed.error);
      }

      console.log('Validated data:', parsed.data);
      const student = await storage.createStudent(parsed.data);
      console.log('Created student:', student);

      res.status(201).json(student);
    } catch (error) {
      console.error('Error in student creation:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/students/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const student = await storage.updateStudent(id, req.body);
    res.json(student);
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

  // Добавляем новый маршрут для управления связями студентов и групп
  app.post("/api/student-groups", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      const parsed = insertStudentGroupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const studentGroup = await storage.addStudentToGroup(parsed.data);
      res.status(201).json(studentGroup);
    } catch (error) {
      console.error('Error adding student to group:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/student-groups/:studentId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const studentId = parseInt(req.params.studentId);
      const groups = await storage.getStudentGroups(studentId);
      res.json(groups);
    } catch (error) {
      console.error('Error getting student groups:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/group-students/:groupId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const groupId = parseInt(req.params.groupId);
      const students = await storage.getGroupStudents(groupId);
      res.json(students);
    } catch (error) {
      console.error('Error getting group students:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Assuming hashPassword function exists elsewhere, you need to import it.
async function hashPassword(password: string): Promise<string> {
  //Implementation for hashing password
  throw new Error("hashPassword function not implemented");
}