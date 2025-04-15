import { Router } from 'express';

const router = Router();

// Эндпоинт для проверки работоспособности сервера
router.get('/diagnostics', (req, res) => {
  const diagnosticInfo = {
    status: 'ok',
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    port: process.env.PORT || '5000',
    viteIntegration: true,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    envVars: {
      NODE_ENV: process.env.NODE_ENV,
      VITE_CONFIG: Boolean(process.env.VITE_CONFIG),
      REPL_ID: Boolean(process.env.REPL_ID),
      PORT: process.env.PORT,
    }
  };

  res.json(diagnosticInfo);
});

// Эндпоинт для проверки подключения клиента
router.get('/client-check', (req, res) => {
  res.json({
    status: 'connected',
    clientIp: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    cookies: req.cookies ? Object.keys(req.cookies).length : 0
  });
});

export default router;