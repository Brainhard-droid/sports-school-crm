import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
    version: 'health-check-v1'
  });
});

export default router;