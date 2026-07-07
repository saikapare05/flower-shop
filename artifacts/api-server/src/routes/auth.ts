import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * POST /api/auth/login
 * Body: { password: string }
 * Returns: { token: string }
 */
router.post('/auth/login', (req, res) => {
  const { password } = req.body as { password?: string };

  if (!process.env.ADMIN_PASSWORD) {
    console.error('[auth] ADMIN_PASSWORD secret is not set');
    res.status(500).json({ error: 'Server misconfiguration: ADMIN_PASSWORD not set.' });
    return;
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    console.warn('[auth] Failed login attempt');
    res.status(401).json({ error: 'Incorrect password.' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const token = jwt.sign({ admin: true }, secret, { expiresIn: '7d' });
  console.info('[auth] Admin login successful');
  res.json({ token });
});

export default router;
