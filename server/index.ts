import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cookieParser from "cookie-parser";
import session from "express-session";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import connectPgSimple from "connect-pg-simple";

const app = express();

// Basic middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust first proxy
app.set("trust proxy", 1);

// CORS middleware BEFORE session
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, Set-Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const PostgresStore = connectPgSimple(session);

// Session configuration
app.use(session({
  store: new PostgresStore({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    },
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  name: 'sid',
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Setup authentication
setupAuth(app);

// Debug middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);
  console.log('Headers:', req.headers);
  console.log('Cookies:', req.cookies);
  console.log('Session:', req.session);
  console.log('Authentication status:', req.isAuthenticated ? req.isAuthenticated() : 'N/A');

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();