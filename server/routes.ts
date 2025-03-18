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
  insertStudentGroupSchema,
  insertDateCommentSchema,
  AttendanceStatus,
} from "@shared/schema";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "./services/email";
import { eq } from 'drizzle-orm';
import { sportsSections, branches, branchSections } from "@shared/schema";
import { db } from './db';

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Добавляем новые роуты для спортивных секций и филиалов
  app.get("/api/sports-sections", async (_req, res) => {
    try {
      const sections = await db.select().from(sportsSections);
      res.json(sections);
    } catch (error) {
      console.error('Error getting sports sections:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Маршрут для получения филиалов по секции
app.get("/api/branches-by-section", async (req, res) => {
  try {
    const sectionId = parseInt(req.query.sectionId as string);
    if (!sectionId) {
      return res.status(400).json({ error: "Missing sectionId parameter" });
    }

    // Получаем филиалы с расписанием для выбранной секции
    const branchesWithSchedule = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        schedule: branchSections.schedule
      })
      .from(branchSections)
      .innerJoin(branches, eq(branches.id, branchSections.branchId))
      .where(eq(branchSections.sectionId, sectionId));

    res.json(branchesWithSchedule);
  } catch (error) {
    console.error('Error getting branches by section:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

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

  app.get("/api/groups/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const id = parseInt(req.params.id);
      const group = await storage.getGroup(id);

      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      res.json(group);
    } catch (error) {
      console.error('Error getting group:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.patch("/api/groups/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const id = parseInt(req.params.id);
      const parsed = insertGroupSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const group = await storage.updateGroup(id, parsed.data);
      res.json(group);
    } catch (error) {
      console.error('Error updating group:', error);
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

  app.patch("/api/schedules/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const id = parseInt(req.params.id);
      const parsed = insertScheduleSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const schedule = await storage.updateSchedule(id, parsed.data);
      res.json(schedule);
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const id = parseInt(req.params.id);
      await storage.deleteSchedule(id);
      res.sendStatus(200);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Updated Attendance routes
  app.get("/api/attendance", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const { groupId, month, year } = req.query;
      if (!groupId || !month || !year) {
        return res.status(400).send("Missing groupId, month or year");
      }

      const attendance = await storage.getAttendance(
        parseInt(groupId as string),
        parseInt(month as string),
        parseInt(year as string)
      );
      res.json(attendance);
    } catch (error) {
      console.error('Error getting attendance:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const parsed = insertAttendanceSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const attendance = await storage.createAttendance(parsed.data);
      res.status(201).json(attendance);
    } catch (error) {
      console.error('Error creating attendance:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.patch("/api/attendance/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!Object.values(AttendanceStatus).includes(status)) {
        return res.status(400).json({ error: "Invalid attendance status" });
      }

      const attendance = await storage.updateAttendance(id, { status });
      res.json(attendance);
    } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Additional endpoints for the attendance feature
  app.get("/api/groups/:groupId/schedule-dates", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const groupId = parseInt(req.params.groupId);
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).send("Missing month or year");
      }

      const dates = await storage.getGroupScheduleDates(
        groupId,
        parseInt(month as string),
        parseInt(year as string)
      );

      res.json(dates);
    } catch (error) {
      console.error('Error getting schedule dates:', error);
      res.status(500).json({ error: (error as Error).message });
    }
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

  // Изменяем endpoint для получения студентов группы
  app.get("/api/group-students/:groupId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const groupId = parseInt(req.params.groupId);
      const groupStudents = await storage.getGroupStudentsWithDetails(groupId);
      res.json(groupStudents);
    } catch (error) {
      console.error('Error getting group students:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Добавляем endpoint для архивирования/активации студента
  app.patch("/api/students/:id/status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const id = parseInt(req.params.id);
      const { active } = req.body;

      const student = await storage.updateStudentStatus(id, active);
      res.json(student);
    } catch (error) {
      console.error('Error updating student status:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Добавляем endpoint для удаления студента
  app.delete("/api/students/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const id = parseInt(req.params.id);
      await storage.deleteStudent(id);
      res.sendStatus(200);
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Добавляем endpoint для удаления группы
  app.delete("/api/groups/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const id = parseInt(req.params.id);
      await storage.deleteGroup(id);
      res.sendStatus(200);
    } catch (error) {
      console.error('Error deleting group:', error);
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

  app.patch("/api/groups/:id/status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const id = parseInt(req.params.id);
      const { active } = req.body;

      const group = await storage.updateGroupStatus(id, active);
      res.json(group);
    } catch (error) {
      console.error('Error updating group status:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Date Comments endpoints
  app.get("/api/date-comments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const { groupId, month, year } = req.query;
      if (!groupId || !month || !year) {
        return res.status(400).send("Missing groupId, month or year");
      }

      const comments = await storage.getDateComments(
        parseInt(groupId as string),
        parseInt(month as string),
        parseInt(year as string)
      );
      res.json(comments);
    } catch (error) {
      console.error('Error getting date comments:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/date-comments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const parsed = insertDateCommentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const comment = await storage.createDateComment(parsed.data);
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating date comment:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.patch("/api/date-comments/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const id = parseInt(req.params.id);
      const { comment } = req.body;

      console.log(`[Routes] Updating comment ${id} with text:`, comment);

      if (!comment) {
        return res.status(400).json({ error: "Comment text is required" });
      }

      const updatedComment = await storage.updateDateComment(id, comment);
      console.log('[Routes] Updated comment:', updatedComment);
      res.json(updatedComment);
    } catch (error) {
      console.error('[Routes] Error updating date comment:', error);
      res.status(500).json({
        error: "Failed to update comment",
        details: error.message
      });
    }
  });

  app.delete("/api/date-comments/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const id = parseInt(req.params.id);
      await storage.deleteDateComment(id);
      res.sendStatus(200);
    } catch (error) {
      console.error('Error deleting date comment:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Bulk attendance update endpoint
  app.post("/api/attendance/bulk", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const { groupId, date, status } = req.body;

      if (!groupId || !date || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!Object.values(AttendanceStatus).includes(status)) {
        return res.status(400).json({ error: "Invalid attendance status" });
      }

      console.log(`Updating bulk attendance for groupId: ${groupId}, date: ${date}, status: ${status}`); // Added logging
      await storage.updateBulkAttendance(groupId, date, status);
      console.log(`Bulk attendance update complete for groupId: ${groupId}, date: ${date}, status: ${status}`); // Added logging
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating bulk attendance:', error);
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