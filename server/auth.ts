import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Passport должен инициализироваться после настройки сессии
  // Инициализация уже выполнена в server/index.ts

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log('Attempting login for username:', username);
        const user = await storage.getUserByUsername(username);

        if (!user) {
          console.log('User not found');
          return done(null, false);
        }

        const isValid = await comparePasswords(password, user.password);
        console.log('Password validation result:', isValid);

        if (!isValid) {
          return done(null, false);
        }

        console.log('User authenticated successfully:', user.id);
        return done(null, user);
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await storage.getUser(id);
      console.log('Deserialized user:', user);
      done(null, user);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('Login request received:', req.body);
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error('Authentication error:', err);
        return next(err);
      }

      if (!user) {
        console.log('Authentication failed');
        return res.status(401).json({ message: "Authentication failed" });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }

        console.log('Login successful');
        console.log('Session after login:', req.session);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('Registration attempt for:', req.body.username);
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('Username already exists');
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        role: "admin",
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) {
          console.error('Auto-login after registration failed:', err);
          return next(err);
        }
        console.log('Registration and auto-login successful for user:', user.id);
        console.log('Session after registration:', req.session);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    console.log('Logout request for user:', req.user?.id);
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      console.log('Logout successful');
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log('User info request. Authenticated:', req.isAuthenticated());
    console.log('Current user:', req.user);
    console.log('Session:', req.session);
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}
