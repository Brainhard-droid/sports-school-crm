import { Express } from "express";
import passport from "passport";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users, insertUserSchema } from "@shared/schema";
import { hashPassword } from "./index";

export function setupAuthRoutes(app: Express) {
  // Register a new user
  app.post("/api/register", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Only admins can register new users" });
      }
      
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);
      
      // Check if username already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, parsed.data.username));
      
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(parsed.data.password);
      
      // Create user
      const [user] = await db
        .insert(users)
        .values({
          ...parsed.data,
          password: hashedPassword,
        })
        .returning();
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Login
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.sendStatus(200);
      });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Password reset request
  app.post("/api/reset-password-request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      if (!user) {
        // Don't reveal that email doesn't exist
        return res.json({ message: "If your email is registered, you will receive a reset link shortly" });
      }
      
      // Generate token and set expiry (24 hours)
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);
      
      // Update user with token
      await db
        .update(users)
        .set({
          resetToken: token,
          resetTokenExpiry: expiry,
        })
        .where(eq(users.id, user.id));
      
      // TODO: Send email with reset link
      
      res.json({ message: "If your email is registered, you will receive a reset link shortly" });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Password reset
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }
      
      // Find user by token
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.resetToken, token));
      
      if (!user || !user.resetTokenExpiry) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      
      // Check if token is expired
      if (new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ error: "Token expired" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(password);
      
      // Update user with new password and clear token
      await db
        .update(users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        })
        .where(eq(users.id, user.id));
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
}